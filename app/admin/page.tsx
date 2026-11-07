import { requireAdmin } from "@/lib/auth";
import { db, dbConfigured, getPrograms, getSettings, pkr, type Enrollment } from "@/lib/db";
import { logout, setStatus, updateEnrollment, updateProgram, updateSettings, verifyPayment } from "./actions";
import { confirmationText } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Abu Bakkar Academy", robots: { index: false } };

const FUNNEL: [string, string][] = [
  ["ad_click", "Ad click"], ["landing_view", "Landing page"], ["enroll_click", "Enroll clicks"], ["form_view", "Enrollment form"],
  ["payment_started", "Payment started"], ["payment_verified", "Payment verified"],
];

async function distinctSessions(name: string) {
  const { data } = await db().from("events").select("session_id").eq("name", name).limit(100000);
  return new Set((data ?? []).map((r: any) => r.session_id)).size;
}

export default async function Admin() {
  requireAdmin();
  if (!dbConfigured()) return <p className="p-8">Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.</p>;

  const { data: ev } = await db().from("events").select("session_id,name,source").in("name", ["landing_view", "referral_visit", "share_whatsapp", "share_facebook", "promise_support"]).limit(100000);
  const traffic: Record<string, Set<string>> = {};
  const shares: Record<string, number> = {};
  for (const e of ev ?? []) {
    if (e.name === "landing_view") (traffic[e.source || "direct"] ??= new Set()).add(e.session_id);
    else shares[e.name] = (shares[e.name] || 0) + 1;
  }
  const [programs, settings, enr, ...counts] = await Promise.all([
    getPrograms(true), getSettings(),
    db().from("enrollments").select("*, programs(name,start_date,timings)").order("created_at", { ascending: false }).limit(500),
    ...FUNNEL.map(([k]) => distinctSessions(k)),
  ]);
  const rows = (enr.data ?? []) as (Enrollment & { programs: any })[];
  const verified = rows.filter((r) => r.status === "verified");
  const revenue = verified.reduce((a, r) => a + r.amount_pkr, 0);
  const spend = Number(settings.ad_spend_pkr || 0);
  const started = rows.filter((r) => r.status !== "pending").length;
  const paidRate = rows.length ? Math.round((verified.length / rows.length) * 100) : 0;
  const pending = rows.filter((r) => r.status === "payment_submitted").length;

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Abu Bakkar Academy — Admin</h1>
        <form action={logout}><button className="btn-outline !border-navy !text-navy !py-2">Log out</button></form>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat l="Revenue (verified)" v={pkr(revenue)} />
        <Stat l="Paid students" v={String(verified.length)} />
        <Stat l="Awaiting verification" v={String(pending)} hot={pending > 0} />
        <Stat l="Enrollments" v={String(rows.length)} />
        <Stat l="Payment completion" v={`${paidRate}%`} />
        <Stat l="Cost / paid student" v={verified.length && spend ? pkr(Math.round(spend / verified.length)) : "—"} />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-navy">Funnel (unique sessions)</h2>
        <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
          {FUNNEL.map(([, label], i) => (
            <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-navy">{counts[i] as number}</p>
              {i > 0 && (counts[i - 1] as number) > 0 && <p className="text-xs text-emerald-700">{Math.round(((counts[i] as number) / (counts[i - 1] as number)) * 100)}% of previous</p>}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Cost per landing visitor: {counts[1] && spend ? pkr(Math.round(spend / (counts[1] as number))) : "—"} · Enrollment form conversion: {counts[1] ? Math.round((rows.length / (counts[1] as number)) * 100) : 0}% · Started payment: {started}</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-navy">Traffic sources &amp; referrals</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th>Source</th><th className="text-right">Visitors</th><th className="text-right">Paid</th></tr></thead>
              <tbody>{Object.entries(traffic).sort((a, b) => b[1].size - a[1].size).slice(0, 25).map(([src, set]) => (
                <tr key={src}><td>{src}</td><td className="text-right">{set.size}</td><td className="text-right">{verified.filter((r) => (r.source || "direct") === src).length}</td></tr>
              ))}</tbody></table>
          </div>
          <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
            <p>Promise supports: <b>{shares.promise_support || 0}</b></p>
            <p>WhatsApp shares: <b>{shares.share_whatsapp || 0}</b></p>
            <p>Facebook shares: <b>{shares.share_facebook || 0}</b></p>
            <p>Referral visits: <b>{shares.referral_visit || 0}</b></p>
            <p className="mt-2 text-xs text-slate-500">Referral sources appear as “referral / code” in the table.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-navy">Enrollments</h2>
        <div className="space-y-3">
          {rows.map((r) => {
            const msg = r.status === "verified"
              ? confirmationText({ ref: r.ref, parent_name: r.parent_name, whatsapp: r.whatsapp, email: r.email, child_first_name: r.child_first_name,
                  program: r.programs?.name, amount: r.amount_pkr, start: r.programs?.start_date ? new Date(r.programs.start_date).toDateString() : "To be confirmed",
                  timings: r.programs?.timings || "TBC", joining: settings.whatsapp_joining_text || "" })
              : `Assalamu Alaikum ${r.parent_name}, this is Abu Bakkar Academy regarding enrollment ${r.ref}.`;
            return (
              <details key={r.id} className="rounded-2xl bg-white p-4 shadow-sm" open={r.status === "payment_submitted"}>
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1">
                  <b className="text-navy">{r.ref}</b>
                  <Badge s={r.status} />
                  <span>{r.parent_name} · {r.child_first_name} ({r.child_age}y, {r.grade})</span>
                  <span className="text-slate-500">{r.programs?.name}</span>
                  <span className="ml-auto font-semibold">{pkr(r.amount_pkr)}</span>
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-1 text-sm">
                    <p>WhatsApp: <b>{r.whatsapp}</b> {r.email && <>· {r.email}</>}</p>
                    <p>City: {r.city} · Preferred schedule: {r.preferred_schedule || "—"}</p>
                    <p>Source: {r.source || "—"} · Created {new Date(r.created_at).toLocaleString("en-PK")}</p>
                    <p>Payment: {r.payment_method || "—"} · Txn: <b>{r.payment_txn_id || "—"}</b> {r.payment_note && `(${r.payment_note})`}</p>
                    <a className="btn-emerald !py-2 mt-2" target="_blank" href={`https://wa.me/${r.whatsapp}?text=${encodeURIComponent(msg)}`}>WhatsApp parent</a>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {r.status !== "verified" && r.status !== "refunded" && (
                        <form action={verifyPayment}><input type="hidden" name="id" value={r.id} /><button className="btn-gold !py-2">Verify payment</button></form>
                      )}
                      {r.status === "payment_submitted" && <Status id={r.id} s="rejected" label="Reject" />}
                      {r.status === "verified" && <Status id={r.id} s="refunded" label="Mark refunded" />}
                    </div>
                    <form action={updateEnrollment} className="space-y-2">
                      <input type="hidden" name="id" value={r.id} />
                      <input name="class_group" defaultValue={r.class_group ?? ""} placeholder="Class group / assignment" className="input !py-2" />
                      <textarea name="admin_notes" defaultValue={r.admin_notes ?? ""} placeholder="Notes" className="input !py-2" rows={2} />
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="followed_up" defaultChecked={r.followed_up} /> WhatsApp follow-up done</label>
                      <button className="btn-emerald !py-2">Save</button>
                    </form>
                  </div>
                </div>
              </details>
            );
          })}
          {!rows.length && <p className="text-slate-500">No enrollments yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-navy">Programs (fees, dates, seats, availability)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((p) => (
            <form key={p.id} action={updateProgram} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
              <input type="hidden" name="id" value={p.id} />
              <F n="name" l="Name" v={p.name} /><F n="description" l="Description" v={p.description} />
              <div className="grid grid-cols-2 gap-2">
                <F n="age_group" l="Age / grade" v={p.age_group} /><F n="price_pkr" l="Fee (PKR)" v={p.price_pkr} t="number" />
                <F n="sessions" l="Sessions" v={p.sessions} t="number" /><F n="duration_weeks" l="Weeks" v={p.duration_weeks} t="number" />
                <F n="timings" l="Timings" v={p.timings} /><F n="teacher" l="Teacher" v={p.teacher} />
                <F n="start_date" l="Start date" v={p.start_date ?? ""} t="date" /><F n="seats_total" l={`Seats total (taken ${p.seats_taken})`} v={p.seats_total} t="number" />
              </div>
              <label className="label">Status</label>
              <select name="status" defaultValue={p.status} className="input !py-2">
                <option value="open">open (enrollment enabled)</option><option value="coming_soon">coming_soon</option><option value="closed">closed (hidden)</option>
              </select>
              <button className="btn-emerald !py-2">Save program</button>
            </form>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-navy">Payment instructions &amp; settings</h2>
        <form action={updateSettings} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm md:max-w-2xl">
          {[["bank_details", "Bank details"], ["jazzcash_number", "JazzCash"], ["easypaisa_number", "Easypaisa"], ["whatsapp_joining_text", "Joining instructions text"], ["ad_spend_pkr", "Total ad spend so far (PKR)"], ["hero_hook", "Website: hero headline"], ["hero_sub", "Website: hero supporting lines"], ["promise_text", "Website: Parent Promise text"]].map(([k, l]) => (
            <div key={k}><label className="label">{l}</label><textarea name={k} defaultValue={settings[k] ?? ""} rows={k === "ad_spend_pkr" || k === "hero_hook" ? 1 : 3} className="input !py-2" /></div>
          ))}
          <button className="btn-emerald !py-2">Save settings</button>
        </form>
      </section>
    </main>
  );
}

const Stat = ({ l, v, hot }: { l: string; v: string; hot?: boolean }) => (
  <div className={`rounded-2xl p-4 shadow-sm ${hot ? "bg-gold-50 ring-2 ring-gold" : "bg-white"}`}><p className="text-xs text-slate-500">{l}</p><p className="text-xl font-bold text-navy">{v}</p></div>
);
const Badge = ({ s }: { s: string }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s === "verified" ? "bg-emerald-50 text-emerald-700" : s === "payment_submitted" ? "bg-gold-50 text-gold-700" : "bg-slate-100 text-slate-600"}`}>{s.replace("_", " ")}</span>
);
const Status = ({ id, s, label }: { id: string; s: string; label: string }) => (
  <form action={setStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={s} /><button className="btn border border-slate-300 !py-2 text-sm">{label}</button></form>
);
const F = ({ n, l, v, t = "text" }: { n: string; l: string; v: string | number; t?: string }) => (
  <div><label className="label">{l}</label><input name={n} type={t} defaultValue={v} className="input !py-2" /></div>
);
