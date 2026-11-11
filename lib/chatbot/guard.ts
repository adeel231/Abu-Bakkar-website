// Checks every reply BEFORE a parent sees it. The AI is told never to invent payment numbers or links, and this
// is the safety net if it ever does: a reply with an unknown number or a foreign link is replaced with a safe message.
import { phoneDigits } from "./facts";

export type GuardResult = { ok: true } | { ok: false; reason: string };

/** The academy's real domain is always trusted, whatever NEXT_PUBLIC_SITE_URL says (for example on a preview deployment). */
const CANONICAL_HOST = "abubakkaracademy.com";
const URL_RE = /https?:\/\/[^\s)>\]]+|\bwww\.[^\s)>\]]+/gi;

export function checkReply(text: string, allowedNumbers: string[], siteUrl: string): GuardResult {
  if (!text.trim()) return { ok: false, reason: "empty reply" };
  if (text.length > 1500) return { ok: false, reason: "reply too long" };

  const allowed = new Set(allowedNumbers);
  for (const d of phoneDigits(text)) if (!allowed.has(d)) return { ok: false, reason: "a number that is not one of ours" };

  let siteHost = "";
  try { siteHost = new URL(siteUrl).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
  for (const u of text.match(URL_RE) ?? []) {
    let host = "";
    try { host = new URL(u.startsWith("http") ? u : "https://" + u).hostname.replace(/^www\./, ""); } catch { return { ok: false, reason: "a malformed link" }; }
    const trusted = [siteHost, CANONICAL_HOST].filter(Boolean);
    const ours = trusted.some((t) => host === t || host.endsWith("." + t)) || host === "wa.me";
    if (!ours) return { ok: false, reason: "a link that is not ours" };
  }
  return { ok: true };
}
