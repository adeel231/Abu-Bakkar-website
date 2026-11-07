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
  const ret = `/admin/payments${all ? "?view=all" : ""}`;

  return (
    <>
      <Flash sp={searchParams} />
      <Section title={all ? "All payments" : "Payments waiting for verification"}
        action={<div className="flex gap-2 text-sm"><Link href="/admin/payments" className={`rounded-lg px-3 py-1.5 ${!all ? "bg-navy text-white" : "bg-white"}`}>To verify</Link><Link href="/admin/payments?view=all" className={`rounded-lg px-3 py-1.5 ${all ? "bg-navy text-white" : "bg-white"}`}>All</Link></div>}>
        <p className="mb-3 rounded-xl bg-gold/15 p-3 text-sm text-navy">Open your JazzCash / Easypaisa / bank statement and find the transaction ID below. Approve only if the money is really there and the amount matches. Never approve from a screenshot.</p>
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
                <div className="mt-2 grid gap-1 text-sm text-slate-700 md:grid-cols-3">
                  <p>Method: <b>{p.method}</b></p><p>Transaction ID: <b className="select-all">{p.txn_ref}</b></p><p>Submitted: {when(p.submitted_at)}</p>
                  {p.note && <p className="md:col-span-3">Sender note: {p.note}</p>}
                  {p.status === "verified" && <p className="md:col-span-3">Verified {when(p.verified_at)} by {p.verified_by} · received {formatPKR(p.amount_received ?? 0)}</p>}
                  {p.admin_note && <p className="md:col-span-3">Admin note: {p.admin_note}</p>}
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
