"use client";
import Link from "next/link";
import { useEffect } from "react";
import { adEvent } from "./Analytics";

export type FunnelEvent =
  | "ad_click" | "landing_view" | "enroll_click" | "form_view" | "payment_started" | "payment_verified"
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

export function currentSource() {
  try {
    const stored = sessionStorage.getItem("aba_src");
    if (stored) return stored;
    const q = new URLSearchParams(location.search);
    const rf = q.get("rf");
    let full: string;
    if (rf) full = "referral / " + rf.slice(0, 12);
    else {
      const src = q.get("utm_source") || (q.get("fbclid") ? "facebook" : "") || (document.referrer ? new URL(document.referrer).hostname : "direct");
      full = [src, q.get("utm_campaign")].filter(Boolean).join(" / ");
    }
    sessionStorage.setItem("aba_src", full);
    return full;
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
export default function Tracker({ event, meta, adOnly }: { event: FunnelEvent; meta?: [string, Record<string, unknown>?]; adOnly?: boolean }) {
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (!adOnly) {
      if (event === "landing_view") {
        if (q.get("fbclid") || q.get("utm_source")) track("ad_click");
        if (q.get("rf")) track("referral_visit");
      }
      track(event);
    }
    if (meta) adEvent(meta[0], meta[1]);
  }, [event]); // eslint-disable-line
  return null;
}

/** Enrollment button that records an enroll_click. */
export function EnrollLink({ href, className, children, "aria-label": ariaLabel }: { href: string; className?: string; children?: React.ReactNode; "aria-label"?: string }) {
  return <Link href={href} className={className} aria-label={ariaLabel} onClick={() => { track("enroll_click"); adEvent("Lead"); }}>{children}</Link>;
}
