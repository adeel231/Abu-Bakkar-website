import { NextResponse } from "next/server";
import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { normalisePk } from "@/lib/pricing";
import { errorCode, friendly } from "@/lib/errors";

const uuid = z.string().uuid().optional().or(z.literal("")).transform((v) => v || null);
const text = (n: number) => z.string().trim().max(n).optional().transform((v) => v || "");

const schema = z.object({
  package_id: z.string().uuid(),
  expected_amount: z.coerce.number().int().min(0).optional(),   // the total the parent saw; the database refuses a mismatch
  parent_name: z.string().trim().min(2).max(100),
  whatsapp: z.string().trim().max(30),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(60),
  student_first_name: z.string().trim().min(1).max(50),
  student_age: z.coerce.number().int().min(3).max(19),
  age_group_id: uuid, subject_id: uuid, preferred_batch_id: uuid,
  school_grade: text(30), preferred_timing: text(200),
  consent: z.literal(true),
  source: text(120),
  utm: z.record(z.string().max(120)).optional(),
  fbp: text(120), fbc: text(200),
  website: z.string().max(0).optional(),          // honeypot: real people leave this empty
});

// Light per-instance rate limit: 12 enrollments / hour / IP (override with ENROLL_RATE_LIMIT, e.g. for automated tests).
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  list.push(now); hits.set(ip, list);
  return list.length > (Number(process.env.ENROLL_RATE_LIMIT) || 12);
}

export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: "Enrollment is temporarily unavailable. Please message us on WhatsApp." }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (limited(ip)) return NextResponse.json({ error: "Too many attempts. Please try again later or message us on WhatsApp." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const consent = parsed.error.issues.some((i) => i.path[0] === "consent");
    return NextResponse.json({ error: consent ? "Please tick the parent consent box to continue." : "Please check the form and fill in every required field." }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website) return NextResponse.json({ error: "Could not submit." }, { status: 400 });
  const wa = normalisePk(d.whatsapp);
  if (!wa) return NextResponse.json({ error: "Enter a valid Pakistani WhatsApp number (e.g. 0333 1234567)." }, { status: 400 });

  const { website, whatsapp, ...rest } = d;
  void website; void whatsapp;
  const { data, error } = await db().rpc("create_enrollment", { p: { ...rest, whatsapp: wa } });
  if (error) {
    const code = errorCode(error);
    return NextResponse.json({ error: friendly(error, "We could not save your enrollment. Please try again.") }, { status: code ? 400 : 500 });
  }
  const r = data as { ref: string; amount: number };
  return NextResponse.json({ ref: r.ref, amount: r.amount });
}
