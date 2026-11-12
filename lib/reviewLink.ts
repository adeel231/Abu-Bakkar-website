// Signed "approve / reject" links for the receipt-uploaded email. A link is tied to ONE payment, ONE action and ONE admin email
// and expires after 3 days. Opening a link never changes anything: it only shows a confirmation page (so mail scanners that
// open links cannot approve a payment). Needs ADMIN_COOKIE_SECRET.
import { createHmac, timingSafeEqual } from "crypto";

export type ReviewAction = "approve" | "reject";
const TTL_SECONDS = 3 * 24 * 3600;
const secret = () => process.env.ADMIN_COOKIE_SECRET || "";
const sign = (p: string, a: string, e: string, u: string) => createHmac("sha256", secret()).update(`review|${p}|${a}|${e}|${u}`).digest("hex");
const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const unb64 = (s: string) => { try { return Buffer.from(s, "base64url").toString("utf8"); } catch { return ""; } };

export function reviewUrl(site: string, paymentId: string, action: ReviewAction, adminEmail: string): string {
  const e = String(Math.floor(Date.now() / 1000) + TTL_SECONDS);
  const q = new URLSearchParams({ p: paymentId, a: action, e, u: b64(adminEmail), s: sign(paymentId, action, e, adminEmail) });
  return `${site.replace(/\/$/, "")}/payment-review?${q.toString()}`;
}

export type ReviewCheck = { ok: true; p: string; a: ReviewAction; email: string } | { ok: false; reason: "invalid" | "expired" };

export function checkReview(q: { p?: string; a?: string; e?: string; u?: string; s?: string }): ReviewCheck {
  const { p = "", a = "", e = "", u = "", s = "" } = q;
  if (!secret() || !/^[0-9a-f-]{36}$/i.test(p) || (a !== "approve" && a !== "reject") || !/^\d{9,12}$/.test(e) || !u || !/^[0-9a-f]{64}$/.test(s)) return { ok: false, reason: "invalid" };
  const email = unb64(u);
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, reason: "invalid" };
  const good = Buffer.from(sign(p, a, e, email), "hex"), got = Buffer.from(s, "hex");
  if (good.length !== got.length || !timingSafeEqual(good, got)) return { ok: false, reason: "invalid" };
  if (Number(e) < Date.now() / 1000) return { ok: false, reason: "expired" };
  return { ok: true, p, a, email };
}
