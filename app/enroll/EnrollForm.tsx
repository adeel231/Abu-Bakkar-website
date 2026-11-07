"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { currentSource, sessionId } from "@/components/Tracker";

type P = { slug: string; name: string; price: number; age: string; timings: string; seats: number };

export default function EnrollForm({ programs, selected }: { programs: P[]; selected?: string }) {
  const router = useRouter();
  const [slug, setSlug] = useState(programs.find((p) => p.slug === selected)?.slug ?? programs[0].slug);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const p = programs.find((x) => x.slug === slug)!;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr("");
    const f = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/enroll", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, program: slug, consent: f.consent === "on", source: currentSource(), session_id: sessionId() }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(j.error || "Something went wrong. Please try again."); setBusy(false); return; }
    router.push(`/pay/${j.ref}`);
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl bg-white p-6 shadow-sm">
      <div>
        <label className="label" htmlFor="program">Selected Program</label>
        <select id="program" className="input" value={slug} onChange={(e) => setSlug(e.target.value)}>
          {programs.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}
        </select>
        <p className="mt-2 text-sm text-emerald-700">Fee payable in advance: <b>PKR {p.price.toLocaleString("en-PK")}</b> · {p.seats} seats left</p>
      </div>
      <div><label className="label" htmlFor="parent_name">Parent’s Full Name</label><input id="parent_name" name="parent_name" required className="input" autoComplete="name" /></div>
      <div><label className="label" htmlFor="whatsapp">WhatsApp Number</label><input id="whatsapp" name="whatsapp" required inputMode="tel" placeholder="03XX XXXXXXX" className="input" autoComplete="tel" /></div>
      <div><label className="label" htmlFor="email">Email (optional)</label><input id="email" name="email" type="email" className="input" autoComplete="email" /></div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="sm:col-span-1"><label className="label" htmlFor="child_first_name">Child’s First Name</label><input id="child_first_name" name="child_first_name" required className="input" /></div>
        <div><label className="label" htmlFor="child_age">Child’s Age</label><input id="child_age" name="child_age" type="number" min={4} max={18} required className="input" /></div>
        <div><label className="label" htmlFor="grade">Current Grade</label><input id="grade" name="grade" required placeholder="e.g. Grade 5" className="input" /></div>
      </div>
      <div><label className="label" htmlFor="city">City</label><input id="city" name="city" required className="input" /></div>
      <div>
        <label className="label" htmlFor="preferred_schedule">Preferred Schedule</label>
        <input id="preferred_schedule" name="preferred_schedule" placeholder={p.timings ? `Batch timings: ${p.timings}` : "e.g. Evenings, weekends"} className="input" />
      </div>
      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input type="checkbox" name="consent" required className="mt-1 h-5 w-5 accent-emerald" />
        <span>
          I am the parent/legal guardian and consent to Abu Bakkar Academy collecting my child’s first name, age and grade to
          deliver classes. I have read the <a href="/privacy" target="_blank" className="underline">Privacy Policy</a> and{" "}
          <a href="/refund-policy" target="_blank" className="underline">Refund &amp; Cancellation Policy</a>.
        </span>
      </label>
      {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <button disabled={busy} className="btn-gold w-full disabled:opacity-60">{busy ? "Please wait…" : "Continue to Payment"}</button>
    </form>
  );
}
