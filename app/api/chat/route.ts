import { NextResponse } from "next/server";
import { z } from "zod";
import { getCatalog, getSettings } from "@/lib/db";
import { ADMISSION_PHONE, buildLiveFacts } from "@/lib/chatbot/facts";
import { checkReply } from "@/lib/chatbot/guard";
import { buildSystemPrompt, handoffText } from "@/lib/chatbot/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** The model used for answers. Set CHAT_MODEL in the hosting settings to change it. */
const model = () => (process.env.CHAT_MODEL || "gpt-4.1-mini").trim();
const BASE = () => (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

const schema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(800) })).min(1).max(40),
});

// ---- Light abuse limits (best effort: each server instance keeps its own counters).
const hits = new Map<string, number[]>();
const RATE = Number(process.env.CHAT_RATE_LIMIT) || 20;                 // messages per IP per 10 minutes
const DAILY = Number(process.env.CHAT_DAILY_LIMIT) || 3000;             // messages per server instance per day
let day = { key: "", n: 0 };
function limited(ip: string) {
  const now = Date.now(), recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= RATE) { hits.set(ip, recent); return "ip"; }
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < 10 * 60_000)) hits.delete(k);
  const key = new Date().toISOString().slice(0, 10);
  if (day.key !== key) day = { key, n: 0 };
  return ++day.n > DAILY ? "day" : null;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  // The newest message must be from the parent. Keep only the recent turns (cheaper and safer) and start with a parent message.
  let history = parsed.data.messages.slice(-10);
  while (history.length && history[0].role !== "user") history = history.slice(1);
  if (!history.length || history[history.length - 1].role !== "user") return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const why = limited(ip);
  if (why) return NextResponse.json({ error: "too_many", reply: `You have sent many messages in a short time. Please message our team on WhatsApp ${ADMISSION_PHONE}.` }, { status: 429 });

  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);
  const facts = buildLiveFacts(catalog, settings);
  const system = buildSystemPrompt(facts.text, ADMISSION_PHONE);
  const safe = handoffText(ADMISSION_PHONE);
  const m = model();

  try {
    const r = await fetch(`${BASE()}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: m, max_completion_tokens: 200, messages: [{ role: "system", content: system }, ...history] }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!r.ok) throw new Error("upstream " + r.status);
    const res = await r.json();
    const choice = res?.choices?.[0];
    if (choice?.message?.refusal || choice?.finish_reason === "content_filter") return NextResponse.json({ reply: safe });
    const text = String(choice?.message?.content ?? "").trim();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abubakkaracademy.com";
    const verdict = checkReply(text, facts.allowedNumbers, siteUrl);
    if (!verdict.ok) { console.warn("[chat] reply replaced:", verdict.reason); return NextResponse.json({ reply: safe }); }
    return NextResponse.json({ reply: text });
  } catch (err) {
    // Never show technical details to a parent. Log only the kind of problem (never the conversation).
    console.error("[chat] AI request failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "unavailable", reply: `Sorry I could not answer right now. Please message our team on WhatsApp ${ADMISSION_PHONE}.` }, { status: 503 });
  }
}
