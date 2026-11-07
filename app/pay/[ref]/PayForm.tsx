"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adEvent } from "@/components/Analytics";

export default function PayForm({ refCode, methods, amount }: { refCode: string; methods: string[]; amount: number }) {
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
    adEvent("AddPaymentInfo", { value: amount, currency: "PKR" }, "add_payment_info");
    router.push(`/confirmation/${refCode}`);
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-navy">Step 2 — Tell us your transaction ID</h2>
      <p className="text-sm text-slate-600">After you have paid, enter the details below. We will check them against our account and confirm your enrollment.</p>
      <div>
        <label className="label" htmlFor="payment_method">Method you used</label>
        <select id="payment_method" name="payment_method" required className="input">{methods.map((m) => <option key={m}>{m}</option>)}</select>
      </div>
      <div>
        <label className="label" htmlFor="payment_txn_id">Transaction ID / reference number</label>
        <input id="payment_txn_id" name="payment_txn_id" required minLength={4} maxLength={60} autoComplete="off" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="payment_note">Sender name or account (optional)</label>
        <input id="payment_note" name="payment_note" maxLength={120} className="input" />
      </div>
      {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{err}</p>}
      <button disabled={busy} className="btn-emerald w-full disabled:opacity-60">{busy ? "Submitting…" : "I Have Paid — Submit for Verification"}</button>
    </form>
  );
}
