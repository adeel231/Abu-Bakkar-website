"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImageUp, X } from "lucide-react";
import { adEvent } from "@/components/Analytics";

const MAX_MB = 5;

export default function PayForm({ refCode, methods, amount }: { refCode: string; methods: string[]; amount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  function pick(f: File | null) {
    setErr("");
    if (preview) URL.revokeObjectURL(preview);
    if (f && f.size > MAX_MB * 1024 * 1024) { setFile(null); setPreview(""); setErr(`The file is too large. Please choose one under ${MAX_MB} MB.`); return; }
    setFile(f);
    setPreview(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : "");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) { setErr("Please upload a photo or screenshot of your payment receipt."); return; }
    setBusy(true); setErr("");
    const fd = new FormData(e.currentTarget);
    fd.set("ref", refCode);
    fd.set("receipt", file);
    const r = await fetch("/api/payment", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(j.error || "Could not submit. Please try again."); setBusy(false); return; }
    adEvent("AddPaymentInfo", { value: amount, currency: "PKR" }, "add_payment_info");
    router.push(`/confirmation/${refCode}`);
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-navy">Step 2 — Upload your payment receipt</h2>
      <p className="text-sm text-slate-600">After you pay, upload a photo or screenshot of the receipt. We check it against our account and confirm your enrollment.</p>

      <div>
        <label className="label" htmlFor="payment_method">Method you used</label>
        <select id="payment_method" name="payment_method" required className="input">{methods.map((m) => <option key={m}>{m}</option>)}</select>
      </div>

      <div>
        <p className="label">Payment receipt</p>
        {!file ? (
          <label htmlFor="receipt" className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald/40 bg-emerald-50/50 px-4 py-8 text-center transition hover:border-emerald hover:bg-emerald-50">
            <ImageUp size={32} className="text-emerald-700" />
            <span className="font-semibold text-navy">Tap to upload receipt</span>
            <span className="text-xs text-slate-500">Photo, screenshot or PDF · up to {MAX_MB} MB</span>
          </label>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
            {preview
              ? <img src={preview} alt="Receipt preview" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              : <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100"><FileText size={28} className="text-slate-500" /></span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy">{file.name}</p>
              <p className="text-xs text-slate-500">{file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`}</p>
              <label htmlFor="receipt" className="mt-1 inline-block cursor-pointer text-sm font-semibold text-emerald-700 underline">Change</label>
            </div>
            <button type="button" onClick={() => pick(null)} aria-label="Remove receipt" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
          </div>
        )}
        <input id="receipt" type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      </div>

      <div>
        <label className="label" htmlFor="payment_txn_id">Transaction ID (optional)</label>
        <input id="payment_txn_id" name="payment_txn_id" maxLength={60} autoComplete="off" className="input" placeholder="Helps us find your payment faster" />
      </div>
      <div>
        <label className="label" htmlFor="payment_note">Sender name or account (optional)</label>
        <input id="payment_note" name="payment_note" maxLength={120} className="input" />
      </div>
      {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{err}</p>}
      <button disabled={busy} className="btn-emerald w-full disabled:opacity-60">{busy ? "Uploading…" : "I Have Paid — Submit Receipt"}</button>
    </form>
  );
}
