"use client";
import Link from "next/link";
import { useEffect } from "react";
import { adEvent } from "./Analytics";

export type FunnelEvent =
  | "ad_click" | "landing_view" | "enroll_click" | "form_view" | "form_start" | "payment_started" | "payment_verified"
  | "share_whatsapp" | "share_facebook" | "promise_support" | "referral_visit";

export function sessionId() {
  try {
    let s = sessionStorage.getItem("aba_sid");
    if (!s) { s = crypto.randomUUID(); sessionStorage.setItem("aba_sid", s); }
    return s;
  } catch { return "anon"; }
}

/** Short anonymous code for this browser, put in shared links as ?rf=. Contains no student information. */
export function myReferralCode() {
  try {
    let c = localStorage.getItem("aba_rf");
    if (!c) { c = Math.random().toString(36).slice(2, 8); localStorage.setItem("aba_rf", c); }
    return c;
  } catch { return "x"; }
}

export type Campaign = { source?: string; medium?: string; campaign?: string; content?: string; term?: string; rf?: string; fbclid?: string; referrer?: string; landing?: string };
const CAMPAIGN_KEY = "aba_campaign";

/** First-touch campaign details from the landing URL (utm_*, referral code, ad click id). Kept 14 days in this browser.
 *  Non-personal; saved with the enrollment so ad spend can be matched to paying students. */
export function captureCampaign(): Campaign {
  try {
    const q = new URLSearchParams(location.search);
    const fresh: Campaign = {
      source: q.get("utm_source") || undefined, medium: q.get("utm_medium") || undefined, campaign: q.get("utm_campaign") || undefined,
      content: q.get("utm_content") || undefined, term: q.get("utm_term") || undefined, rf: q.get("rf")?.slice(0, 12) || undefined,
      fbclid: q.get("fbclid") ? "1" : undefined,
    };
    const hasNew = Object.values(fresh).some(Boolean);
    const raw = localStorage.getItem(CAMPAIGN_KEY);
    if (raw && !hasNew) {
      const o = JSON.parse(raw);
      if (Date.now() - o.t < 14 * 864e5) return o.c as Campaign;
    }
    let referrer: string | undefined;
    try { referrer = document.referrer ? new URL(document.referrer).hostname : undefined; } catch {}
    if (referrer === location.hostname) referrer = undefined;
    const c: Campaign = { ...fresh, referrer, landing: location.pathname };
    if (!hasNew && !referrer && !raw) { /* plain direct visit */ }
    if (hasNew || referrer || !raw) localStorage.setItem(CAMPAIGN_KEY, JSON.stringify({ t: Date.now(), c }));
    return c;
  } catch { return {}; }
}

export function currentSource() {
  try {
    const c = captureCampaign();
    if (c.rf) return "referral / " + c.rf;
    const src = c.source || (c.fbclid ? "facebook" : "") || c.referrer || "direct";
    return [src, c.campaign].filter(Boolean).join(" / ");
  } catch { return "direct"; }
}

/** First-party anonymous funnel counter: random session id + source only, no personal data. */
export function track(name: FunnelEvent) {
  try {
    fetch("/api/track", {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ session_id: sessionId(), name, source: currentSource() }),
    });
  } catch {}
}

/** adOnly: skip the first-party funnel row (used where the server already records it, e.g. payment_verified). */
export default function Tracker({ event, meta, adOnly }: { event: FunnelEvent; meta?: [string, Record<string, unknown>?, string?]; adOnly?: boolean }) {
  useEffect(() => {
    captureCampaign();
    const q = new URLSearchParams(location.search);
    if (!adOnly) {
      if (event === "landing_view") {
        if (q.get("fbclid") || q.get("utm_source")) track("ad_click");
        if (q.get("rf")) track("referral_visit");
      }
      track(event);
    }
    if (meta) adEvent(meta[0], meta[1], meta[2]);
  }, [event]); // eslint-disable-line
  return null;
}

/** Enrollment button that records an enroll_click. */
export function EnrollLink({ href, className, children, "aria-label": ariaLabel }: { href: string; className?: string; children?: React.ReactNode; "aria-label"?: string }) {
  return <Link href={href} className={className} aria-label={ariaLabel} onClick={() => { track("enroll_click"); adEvent("Lead"); }}>{children}</Link>;
}
