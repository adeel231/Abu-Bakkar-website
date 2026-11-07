import Link from "next/link";
import { db, dbConfigured, getSettings, type EnrollmentRow } from "@/lib/db";
import { formatPKR, isConfigured } from "@/lib/pricing";
import { Flash, Section, Stat } from "./ui";

export const dynamic = "force-dynamic";

const FUNNEL: [string, string][] = [
  ["ad_click", "Ad click"], ["landing_view", "Website visits"], ["enroll_click", "Enroll button clicks"], ["form_view", "Enrollment page"],
  ["form_start", "Form started"], ["payment_started", "Checkout started"],
];

export default async function Overview({ searchParams }: { searchParams: { msg?: string; err?: string } }) {
  if (!dbConfigured()) return <p>Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.</p>;
  const c = db();
  const [enr, ev, st, batches, pay] = await Promise.all([
    c.from("enrollments").select("id,ref,status,amount_pkr,source,program_name,class_type,package_label,created_at,verified_at,utm").order("created_at", { ascending: false }).limit(5000),
    c.from("events").select("session_id,name,source").limit(200000),
    getSettings(),
    c.from("class_batches").select("id").eq("active", true),
    c.from("payments").select("id").eq("status", "submitted"),
  ]);
  const rows = (enr.data ?? []) as Pick<EnrollmentRow, "id" | "ref" | "status" | "amount_pkr" | "source" | "program_name" | "class_type" | "package_label" | "created_at" | "verified_at" | "utm">[];
  const verified = rows.filter((r) => r.status === "verified");
  const revenue = verified.reduce((a, r) => a + r.amount_pkr, 0);
  const spend = Number(st.ad_spend_pkr || 0);
  const awaiting = pay.data?.length ?? 0;
  const completion = rows.length ? Math.round((verified.length / rows.length) * 100) : 0;

  // distinct sessions per funnel step
  const sessions: Record<string, Set<string>> = {};
  const traffic: Record<string, Set<string>> = {};
  const shares: Record<string, number> = {};
  for (const e of (ev.data ?? []) as any[]) {
    (sessions[e.name] ??= new Set()).add(e.session_id);
    if (e.name === "landing_view") (traffic[e.source || "direct"] ??= new Set()).add(e.session_id);
    if (["share_whatsapp", "share_facebook", "promise_support", "referral_visit"].includes(e.name)) shares[e.name] = (shares[e.name] || 0) + 1;
  }
  const visitors = sessions.landing_view?.size ?? 0;

  // by source
  const bySource = new Map<string, { visitors: number; enrolled: number; paid: number; revenue: number }>();
  const get = (k: string) => { if (!bySource.has(k)) bySource.set(k, { visitors: 0, enrolled: 0, paid: 0, revenue: 0 }); return bySource.get(k)!; };
  for (const [k, set] of Object.entries(traffic)) get(k).visitors = set.size;
  for (const r of rows) { const o = get(r.source || "direct"); o.enrolled++; if (r.status === "verified") { o.paid++; o.revenue += r.amount_pkr; } }
  const sources = Array.from(bySource.entries()).sort((a, b) => b[1].revenue - a[1].revenue || b[1].visitors - a[1].visitors).slice(0, 30);

  // revenue by service / class type / package
  const byPlan = new Map<string, { n: number; revenue: number }>();
  for (const r of verified) {
    const k = [r.program_name || "Earlier enrollments", r.class_type === "group" ? "Group" : r.class_type === "private" ? "Private" : "", r.package_label || ""].filter(Boolean).join(" · ");
    const o = byPlan.get(k) ?? { n: 0, revenue: 0 }; o.n++; o.revenue += r.amount_pkr; byPlan.set(k, o);
  }

  const missing: string[] = [];
  if (![st.bank_details, st.jazzcash_number, st.easypaisa_number].some(isConfigured)) missing.push("Add your real payment details (Settings) — parents cannot pay without them.");
  if (!(batches.data?.length)) missing.push("No class batches yet (Class Batches). Create one to place enrolled students and to show 'Limited Seats' honestly.");
  if (!spend) missing.push("Enter your total ad spend (Settings) to see cost per paid student.");

  return (
    <>
      <Flash sp={searchParams} />
      {missing.length > 0 && (
        <div className="rounded-2xl bg-gold/15 p-4 text-sm text-navy"><p className="font-bold">Before you run ads</p><ul className="mt-1 list-disc pl-5">{missing.map((m) => <li key={m}>{m}</li>)}</ul></div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat l="Revenue (verified)" v={formatPKR(revenue)} />
        <Stat l="Paid students" v={String(verified.length)} />
        <Link href="/admin/payments"><Stat l="Payments to verify" v={String(awaiting)} hot={awaiting > 0} /></Link>
        <Stat l="All enrollments" v={String(rows.length)} />
        <Stat l="Payment completion" v={`${completion}%`} />
        <Stat l="Cost per paid student" v={verified.length && spend ? formatPKR(spend / verified.length) : "—"} />
      </section>

      <Section title="Funnel (unique visitors)">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
          {FUNNEL.map(([k, label], i) => {
            const n = sessions[k]?.size ?? 0, prev = i > 0 ? sessions[FUNNEL[i - 1][0]]?.size ?? 0 : 0;
            return (
              <div key={k} className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">{label}</p><p className="text-2xl font-bold text-navy">{n}</p>
                {i > 0 && prev > 0 && <p className="text-xs text-emerald-700">{Math.round((n / prev) * 100)}% of previous</p>}
              </div>
            );
          })}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-2 ring-emerald/30"><p className="text-xs text-slate-500">Verified purchases</p><p className="text-2xl font-bold text-navy">{verified.length}</p></div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Cost per website visitor: {visitors && spend ? formatPKR(spend / visitors) : "—"} · Visitors → enrollment started: {visitors ? Math.round((rows.length / visitors) * 100) : 0}% · Shares: WhatsApp {shares.share_whatsapp || 0}, Facebook {shares.share_facebook || 0}, promise supports {shares.promise_support || 0}, referral visits {shares.referral_visit || 0}
        </p>
      </Section>

      <Section title="Advertising sources and referrals" action={<Link className="text-sm underline" href="/admin/export">Export all enrollments (CSV)</Link>}>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[34rem] text-sm">
            <thead><tr className="text-left text-slate-500"><th className="p-3">Source / campaign</th><th className="p-3 text-right">Visitors</th><th className="p-3 text-right">Enrollments</th><th className="p-3 text-right">Paid</th><th className="p-3 text-right">Revenue</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map(([k, o]) => <tr key={k}><td className="p-3 font-medium text-navy">{k}</td><td className="p-3 text-right">{o.visitors}</td><td className="p-3 text-right">{o.enrolled}</td><td className="p-3 text-right">{o.paid}</td><td className="p-3 text-right">{formatPKR(o.revenue)}</td></tr>)}
              {!sources.length && <tr><td className="p-3 text-slate-500" colSpan={5}>No traffic recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">Tip: tag every ad link with <code>?utm_source=facebook&amp;utm_campaign=your-campaign</code>. Referral shares appear as “referral / code”.</p>
      </Section>

      <Section title="Revenue by package">
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[28rem] text-sm">
            <thead><tr className="text-left text-slate-500"><th className="p-3">Service · class type · package</th><th className="p-3 text-right">Students</th><th className="p-3 text-right">Revenue</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from(byPlan.entries()).map(([k, o]) => <tr key={k}><td className="p-3 font-medium text-navy">{k}</td><td className="p-3 text-right">{o.n}</td><td className="p-3 text-right">{formatPKR(o.revenue)}</td></tr>)}
              {!byPlan.size && <tr><td className="p-3 text-slate-500" colSpan={3}>No verified payments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
