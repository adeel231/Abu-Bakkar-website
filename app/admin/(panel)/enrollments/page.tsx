import Link from "next/link";
import { db, type EnrollmentRow, type PaymentRow } from "@/lib/db";
import { CLASS_TYPE_LABEL, formatPKR } from "@/lib/pricing";
import { assignBatch, refundEnrollment, updateEnrollment } from "../../actions";
import { Badge, Flash, Section, waLink, when } from "../ui";

export const dynamic = "force-dynamic";
const STATUSES = ["all", "pending", "payment_submitted", "verified", "rejected", "refunded"];

export default async function Enrollments({ searchParams }: { searchParams: { status?: string; q?: string; msg?: string; err?: string } }) {
  const status = STATUSES.includes(searchParams.status || "") ? searchParams.status! : "all";
  const term = (searchParams.q || "").trim().toLowerCase();
  const c = db();
  let q = c.from("enrollments").select("*").order("created_at", { ascending: false }).limit(1000);
  if (status !== "all") q = q.eq("status", status);
  const [er, br, ag, vr] = await Promise.all([
    q, c.from("class_batches").select("*").eq("active", true).order("name"), c.from("age_groups").select("*").order("sort"),
    c.from("enrollments").select("class_batch_id").eq("status", "verified").not("class_batch_id", "is", null),
  ]);
  let rows = (er.data ?? []) as EnrollmentRow[];
  if (term) rows = rows.filter((r) => [r.ref, r.parent_name, r.whatsapp, r.child_first_name, r.city, r.email ?? ""].join(" ").toLowerCase().includes(term));
  rows = rows.slice(0, 200);
  const batches = (br.data ?? []) as any[];
  const groups = (ag.data ?? []) as any[];
  const taken = new Map<string, number>();
  for (const r of (vr.data ?? []) as { class_batch_id: string }[]) taken.set(r.class_batch_id, (taken.get(r.class_batch_id) || 0) + 1);

  const ids = rows.map((r) => r.id);
  const pays = ids.length ? ((await c.from("payments").select("*").in("enrollment_id", ids)).data ?? []) as PaymentRow[] : [];
  const lastPay = new Map<string, PaymentRow>();
  for (const p of pays.sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))) lastPay.set(p.enrollment_id, p);
  const ret = `/admin/enrollments?status=${status}${term ? `&q=${encodeURIComponent(term)}` : ""}`;

  return (
    <>
      <Flash sp={searchParams} />
      <Section title="Enrollments" action={<Link className="text-sm underline" href={`/admin/export?status=${status}`}>Export CSV</Link>}>
        <form className="mb-4 flex flex-wrap gap-2" method="get">
          <input name="q" defaultValue={searchParams.q} placeholder="Search name, WhatsApp, ID, city…" className="input !w-72 !py-2" />
          <select name="status" defaultValue={status} className="input !w-52 !py-2">{STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s.replace("_", " ")}</option>)}</select>
          <button className="btn-emerald !py-2">Filter</button>
        </form>

        <div className="space-y-3">
          {rows.map((r) => {
            const p = lastPay.get(r.id);
            const fits = batches.filter((b) => b.program_id === r.program_id && (!b.class_type || b.class_type === r.class_type) && (!b.age_group_id || !r.age_group_id || b.age_group_id === r.age_group_id));
            const msg = r.status === "verified"
              ? `Assalamu Alaikum ${r.parent_name}, ${r.child_first_name} is enrolled at Abu Bakkar Academy. Enrollment ID: ${r.ref}. Package: ${r.package_label ?? ""} (${formatPKR(r.amount_pkr)}).`
              : `Assalamu Alaikum ${r.parent_name}, this is Abu Bakkar Academy about enrollment ${r.ref}.`;
            return (
              <details key={r.id} className="rounded-2xl bg-white p-4 shadow-sm" open={r.status === "verified" && !r.class_batch_id}>
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1">
                  <b className="text-navy">{r.ref}</b><Badge s={r.status} />
                  <span>{r.parent_name} · {r.child_first_name} ({r.child_age}y{r.grade ? `, ${r.grade}` : ""})</span>
                  <span className="text-slate-500">{r.program_name ?? "Earlier enrollment"} {r.class_type ? `· ${CLASS_TYPE_LABEL[r.class_type]}` : ""} {r.package_label ? `· ${r.package_label}` : ""}</span>
                  {r.status === "verified" && !r.class_batch_id && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-navy">needs a class</span>}
                  <span className="ml-auto font-semibold">{formatPKR(r.amount_pkr)}</span>
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-1 text-sm">
                    <p>WhatsApp: <b>{r.whatsapp}</b>{r.email ? ` · ${r.email}` : ""}</p>
                    <p>City: {r.city}{r.subject_name ? ` · Subject: ${r.subject_name}` : ""}</p>
                    <p>Preferred timing: {r.preferred_schedule || "—"}</p>
                    <p>Source: {r.source || "—"}{r.utm?.campaign ? ` · campaign: ${r.utm.campaign}` : ""}</p>
                    <p>Created {when(r.created_at)}{r.verified_at ? ` · verified ${when(r.verified_at)}` : ""}</p>
                    {p && <p>Payment: {p.method} · <b>{p.txn_ref}</b> · {p.status}{p.amount_received ? ` · received ${formatPKR(p.amount_received)}` : ""}</p>}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <a className="btn-emerald !py-2" target="_blank" href={waLink(r.whatsapp, msg)}>WhatsApp parent</a>
                      {r.status === "payment_submitted" && <Link className="btn-gold !py-2" href="/admin/payments">Go to verify</Link>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {r.status === "verified" && (
                      <form action={assignBatch} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="id" value={r.id} /><input type="hidden" name="return" value={ret} />
                        <div className="min-w-[14rem] flex-1"><label className="label">Class batch</label>
                          <select name="batch_id" defaultValue={r.class_batch_id ?? ""} className="input !py-2">
                            <option value="">— not assigned —</option>
                            {fits.map((b) => <option key={b.id} value={b.id}>{b.name} · {b.timing || "time TBC"} ({Math.max(0, b.capacity - (taken.get(b.id) || 0))} seats left)</option>)}
                          </select></div>
                        <button className="btn-emerald !py-2">Save class</button>
                      </form>
                    )}
                    <form action={updateEnrollment} className="space-y-2">
                      <input type="hidden" name="id" value={r.id} /><input type="hidden" name="return" value={ret} />
                      {r.program_name && !r.subject_name && r.age_group_id !== null && (
                        <div><label className="label">Age group (admin confirms placement for ages 8 and 12)</label>
                          <select name="age_group_id" defaultValue={r.age_group_id ?? ""} className="input !py-2"><option value="">—</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.label} (ages {g.min_age}–{g.max_age})</option>)}</select></div>
                      )}
                      <textarea name="admin_notes" defaultValue={r.admin_notes ?? ""} placeholder="Notes" rows={2} className="input !py-2" />
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="followed_up" defaultChecked={r.followed_up} /> WhatsApp follow-up done</label>
                      <button className="btn border border-slate-300 !py-2 text-navy">Save notes</button>
                    </form>
                    {r.status === "verified" && (
                      <form action={refundEnrollment} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                        <input type="hidden" name="id" value={r.id} /><input type="hidden" name="return" value={ret} />
                        <input name="note" placeholder="Refund note" className="input !w-56 !py-2" />
                        <button className="btn border border-red-300 !py-2 text-red-700">Mark refunded</button>
                      </form>
                    )}
                  </div>
                </div>
              </details>
            );
          })}
          {!rows.length && <p className="rounded-2xl bg-white p-4 text-slate-500 shadow-sm">No enrollments match.</p>}
        </div>
      </Section>
    </>
  );
}
