"use client";
import { useEffect, useRef, useState } from "react";
import { adEvent } from "@/components/Analytics";
import { captureCampaign } from "@/components/Tracker";
import { AGE_BANDS, LEVELS, TEACHER_PREFS } from "@/lib/quran";

const COUNTRIES = ["United Kingdom", "United States", "Canada", "Australia", "United Arab Emirates", "Other"];

/** Free assessment booking. No card details. Analytics events carry no personal or child data. */
export default function BookForm({ defaultCountry = "United Kingdom" }: { defaultCountry?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const started = useRef(false);
  const [tz, setTz] = useState("");
  useEffect(() => { try { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || ""); } catch {} }, []);

  const onStart = () => {
    if (started.current) return;
    started.current = true;
    adEvent("QuranTrialBookingStarted", { page: location.pathname }, "trial_booking_started");
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setState("sending");
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(f.entries()) as Record<string, unknown>;
    body.consent = f.get("consent") === "on";
    const c = captureCampaign();
    body.landing_page = c.landing || location.pathname;
    body.source = [c.source, c.medium].filter(Boolean).join(" / ") || c.referrer || "direct";
    body.utm = { source: c.source, medium: c.medium, campaign: c.campaign, term: c.term, rf: c.rf };
    const r = await fetch("/api/quran/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) { setState("idle"); setError(j.error || "We could not save your booking. Please try again or message us on WhatsApp."); return; }
    adEvent("Lead", { service: "quran", country: String(body.country) }, "generate_lead");
    adEvent("QuranTrialBooked", { service: "quran", country: String(body.country) }, "trial_booked");
    setState("done");
  }

  if (state === "done") return (
    <div className="rounded-2xl border-2 border-emerald-700 bg-emerald-50 p-6 text-center" role="status">
      <h2 className="font-serif text-2xl font-bold text-[#0b5a3e]">Thank you. Your request is received.</h2>
      <p className="mt-2 text-slate-700">We have emailed you a confirmation. We will contact you on WhatsApp to confirm your teacher and assessment time, usually within one working day.</p>
    </div>
  );

  const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5";
  return (
    <form onSubmit={submit} onFocus={onStart} className="space-y-4" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Parent / guardian name<input name="parent_name" required minLength={2} maxLength={100} autoComplete="name" className={input} /></label>
        <label className="block text-sm font-semibold">Parent email<input name="email" type="email" required maxLength={120} autoComplete="email" className={input} /></label>
        <label className="block text-sm font-semibold">Parent WhatsApp (with country code)<input name="whatsapp" type="tel" required placeholder="+44 7700 900000" maxLength={25} autoComplete="tel" className={input} /></label>
        <label className="block text-sm font-semibold">Country<select name="country" defaultValue={defaultCountry} required className={input}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="block text-sm font-semibold">Time zone<input name="time_zone" required value={tz} onChange={(e) => setTz(e.target.value)} placeholder="e.g. Europe/London" maxLength={60} className={input} /></label>
        <label className="block text-sm font-semibold">Student first name or preferred name<input name="student_name" required maxLength={50} className={input} /></label>
        <label className="block text-sm font-semibold">Student age band<select name="age_band" required className={input}>{AGE_BANDS.map((a) => <option key={a}>{a}</option>)}</select></label>
        <label className="block text-sm font-semibold">Quran learning level<select name="level" required className={input}>{LEVELS.map((a) => <option key={a}>{a}</option>)}</select></label>
        <label className="block text-sm font-semibold">Preferred teacher<select name="teacher_pref" className={input}>{TEACHER_PREFS.map((a) => <option key={a}>{a}</option>)}</select></label>
        <label className="block text-sm font-semibold">Preferred lesson time (in your time zone)<input name="preferred_time" required maxLength={200} placeholder="e.g. weekdays 5–7 pm, Saturday morning" className={input} /></label>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="consent" required className="mt-1" />
        <span>I am the parent or guardian. I agree that Abu Bakkar Academy may contact me about this assessment and store these details as described in the <a className="underline" href="/privacy" target="_blank">privacy policy</a>.</span></label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={state === "sending"} className="w-full rounded-full bg-emerald-700 py-3.5 font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{state === "sending" ? "Sending…" : "Book My Free Assessment"}</button>
      <p className="text-sm text-slate-700">No card details needed.</p>
    </form>
  );
}
