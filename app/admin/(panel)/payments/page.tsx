import Link from "next/link";
import { db, type EnrollmentRow, type PaymentRow } from "@/lib/db";
import { CLASS_TYPE_LABEL, formatPKR } from "@/lib/pricing";
import { rejectPayment, verifyPayment } from "../../actions";
import { Badge, Flash, Section, waLink, when } from "../ui";

export const dynamic = "force-dynamic";

export default async function Payments({ searchParams }: { searchParams: { view?: string; msg?: string; err?: string } }) {
  const all = searchParams.view === "all";
  const c = db();
  let q = c.from("payments").select("*").order("submitted_at", { ascending: false }).limit(500);
  if (!all) q = q.eq("status", "submitted");
  const pays = ((await q).data ?? []) as PaymentRow[];
  const ids = Array.from(new Set(pays.map((p) => p.enrollment_id)));
  const enr = ids.length ? ((await c.from("enrollments").select("*").in("id", ids)).data ?? []) as EnrollmentRow[] : [];
  const byId = new Map(enr.map((e) => [e.id, e]));
  // Receipts are private: show them through links that expire after an hour.
  const paths = pays.map((p) => p.receipt_path).filter((x): x is string => !!x);
  const signed = paths.length ? ((await c.storage.from("receipts").createSignedUrls(paths, 3600)).data ?? []) : [];
  const receiptUrl = new Map(signed.filter((s) => s.signedUrl && s.path).map((s) => [s.path as string, s.signedUrl]));
  const ret = `/admin/payments${all ? "?view=all" : ""}`;

  return (
    <>
      <Flash sp={searchParams} />
      <Section title={all ? "All payments" : "Payments waiting for verification"}
        action={<div className="flex gap-2 text-sm"><Link href="/admin/payments" className={`rounded-lg px-3 py-1.5 ${!all ? "bg-navy text-white" : "bg-white"}`}>To verify</Link><Link href="/admin/payments?view=all" className={`rounded-lg px-3 py-1.5 ${all ? "bg-navy text-white" : "bg-white"}`}>All</Link></div>}>
        <p className="mb-3 rounded-xl bg-gold/15 p-3 text-sm text-navy">Open the receipt, then check your JazzCash / Easypaisa / bank statement. Approve only if the money is really in your account and the amount matches. A receipt alone can be edited, so always confirm in your statement.</p>
        <div className="space-y-3">
          {pays.map((p) => {
            const e = byId.get(p.enrollment_id);
            return (
              <div key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <b className="text-navy">{e?.ref}</b><Badge s={p.status} />
                  <span>{e?.parent_name} · {e?.child_first_name}</span>
                  <span className="text-slate-500">{e?.program_name} · {e?.class_type ? CLASS_TYPE_LABEL[e.class_type] : ""} · {e?.package_label}</span>
                  <span className="ml-auto text-lg font-bold text-navy">{formatPKR(p.amount_pkr)}</span>
                </div>
                <div className="mt-3 flex flex-col gap-4 sm:flex-row">
                {p.receipt_path && (() => {
                  const url = receiptUrl.get(p.receipt_path);
                  const pdf = p.receipt_path.endsWith(".pdf");
                  return url ? (
                    <a href={url} target="_blank" rel="noopener" className="group block w-full shrink-0 sm:w-40" title="Open receipt in a new tab">
                      {pdf
                        ? <span className="flex h-40 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-navy group-hover:bg-slate-100">📄 Open PDF receipt</span>
                        : <img src={url} alt={`Receipt for ${e?.ref ?? ""}`} className="h-40 w-full rounded-xl border border-slate-200 object-cover transition group-hover:opacity-90" />}
                      <span className="mt-1 block text-center text-xs font-semibold text-emerald-700 underline">View full receipt</span>
                    </a>
                  ) : <p className="text-sm text-red-700">Receipt could not be loaded.</p>;
                })()}
                <div className="grid flex-1 content-start gap-1 text-sm text-slate-700 md:grid-cols-2">
                  <p>Method: <b>{p.method}</b></p><p>Transaction ID: {p.txn_ref ? <b className="select-all">{p.txn_ref}</b> : <span className="text-slate-400">not given</span>}</p><p>Submitted: {when(p.submitted_at)}</p>
                  {p.note && <p className="md:col-span-3">Sender note: {p.note}</p>}
                  {p.status === "verified" && <p className="md:col-span-3">Verified {when(p.verified_at)} by {p.verified_by} · received {formatPKR(p.amount_received ?? 0)}</p>}
                  {p.admin_note && <p className="md:col-span-3">Admin note: {p.admin_note}</p>}
                </div>
                </div>
                {p.status === "submitted" && (
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <form action={verifyPayment} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="payment_id" value={p.id} /><input type="hidden" name="return" value={ret} />
                      <div><label className="label">Amount received (PKR)</label><input name="received" type="number" min={0} required defaultValue={p.amount_pkr} className="input !w-40 !py-2" /></div>
                      <button className="btn-gold !py-2">Verify and enroll</button>
                    </form>
                    <form action={rejectPayment} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="payment_id" value={p.id} /><input type="hidden" name="return" value={ret} />
                      <div><label className="label">Reason (optional)</label><input name="note" className="input !w-48 !py-2" placeholder="Not found in statement" /></div>
                      <button className="btn border border-red-300 !py-2 text-red-700">Reject</button>
                    </form>
                    {e && <a className="btn border border-slate-300 !py-2 text-navy" target="_blank" href={waLink(e.whatsapp, `Assalamu Alaikum ${e.parent_name}, this is Abu Bakkar Academy about enrollment ${e.ref}.`)}>WhatsApp parent</a>}
                  </div>
                )}
              </div>
            );
          })}
          {!pays.length && <p className="rounded-2xl bg-white p-4 text-slate-500 shadow-sm">{all ? "No payments yet." : "Nothing to verify right now."}</p>}
        </div>
      </Section>
    </>
  );
}
