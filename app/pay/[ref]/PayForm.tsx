"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PayForm({ refCode }: { refCode: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const f = Object.fromEntries(new FormData(e.currentTarget).entries());
    const r = await fetch("/api/payment", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, ref: refCode }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(j.error || "Could not submit. Please try again."); setBusy(false); return; }
    router.push(`/confirmation/${refCode}`);
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-navy">After paying, tell us the details</h2>
      <div>
        <label className="label" htmlFor="payment_method">Method used</label>
        <select id="payment_method" name="payment_method" required className="input">
          <option>JazzCash</option><option>Easypaisa</option><option>Bank transfer</option>
        </select>
      </div>
      <div><label className="label" htmlFor="payment_txn_id">Transaction ID / Reference number</label><input id="payment_txn_id" name="payment_txn_id" required minLength={4} className="input" /></div>
      <div><label className="label" htmlFor="payment_note">Sender name / account (optional)</label><input id="payment_note" name="payment_note" className="input" /></div>
      {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <button disabled={busy} className="btn-emerald w-full disabled:opacity-60">{busy ? "Submitting…" : "I Have Paid — Submit for Verification"}</button>
    </form>
  );
}
