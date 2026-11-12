import Link from "next/link";
import { ArrowRight, BadgeCheck, CreditCard, Download, Eye, Heart, Megaphone, Percent, Repeat, Share2, Users, Wallet } from "lucide-react";
import { db, dbConfigured, getSettings, type EnrollmentRow } from "@/lib/db";
import { formatPKR } from "@/lib/pricing";
import { resolveRange } from "@/lib/range";
import { sectionName } from "@/lib/sections";
import { Flash, Section, Stat } from "./ui";
import RangeSelector from "./RangeSelector";

export const dynamic = "force-dynamic";

/** Supabase returns at most 1000 rows per request, so read in pages until everything is loaded. */
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: unknown; error?: unknown }>, cap = 100000, strict = false): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < cap; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error && strict) throw error;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

const FUNNEL: [string, string][] = [
  ["ad_click", "Ad click"], ["landing_view", "Website visits"], ["enroll_click", "Enroll button clicks"], ["form_view", "Enrollment page"],
  ["form_start", "Form started"], ["payment_started", "Checkout started"],
];

type Enr = Pick<EnrollmentRow, "id" | "ref" | "status" | "amount_pkr" | "source" | "program_name" | "class_type" | "package_label" | "created_at" | "verified_at" | "utm">;
const ENR_COLS = "id,ref,status,amount_pkr,source,program_name,class_type,package_label,created_at,verified_at,utm";

export default async function Overview({ searchParams }: { searchParams: { msg?: string; err?: string; range?: string; from?: string; to?: string } }) {
  if (!dbConfigured()) return <p>Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.</p>;
  const c = db();
  const range = resolveRange(searchParams);
  const { start, end } = range;
  const inRange = <Q extends { gte: (c: string, v: string) => Q; lt: (c: string, v: string) => Q }>(q: Q, col: string) => (start && end ? q.gte(col, start).lt(col, end) : q);

  type Ev = { session_id: string; name: string; source: string | null; section?: string | null; rf?: string | null; visitor?: string | null };
  // The newer columns (section, sharer code, visitor id) exist only after the latest database update: try the richest
  // selection first and fall back to what the database has, so the dashboard works before and after the update.
  const EVENT_COLS = ["session_id,name,source,section,rf,visitor", "session_id,name,source,section,rf", "session_id,name,source"];
  const loadEvents = async (): Promise<{ rows: Ev[]; detailed: boolean; hasVisitor: boolean }> => {
    for (let i = 0; i < EVENT_COLS.length; i++) {
      try {
        const rows = await fetchAll<Ev>((a, b) => inRange(c.from("events").select(EVENT_COLS[i]), "created_at").order("id").range(a, b), 100000, i < EVENT_COLS.length - 1);
        return { rows, detailed: i < 2, hasVisitor: i === 0 };
      } catch { /* this selection is not available yet: try the next one */ }
    }
    return { rows: [], detailed: false, hasVisitor: false };
  };

  const [created, paidThen, evs, st, pay] = await Promise.all([
    // enrollments STARTED in the period (activity, sources, completion)
    fetchAll<Enr>((a, b) => inRange(c.from("enrollments").select(ENR_COLS), "created_at").order("created_at", { ascending: false }).order("id").range(a, b)),
    // payments VERIFIED in the period (money received)
    fetchAll<Enr>((a, b) => inRange(c.from("enrollments").select(ENR_COLS).eq("status", "verified"), "verified_at").order("id").range(a, b)),
    loadEvents(),
    getSettings(),
    c.from("payments").select("id").eq("status", "submitted"),
  ]);
  const events = evs.rows;
  const rows = created;                                           // started in the period
  const verified = paidThen;                                      // paid (verified) in the period
  const revenue = verified.reduce((a, r) => a + r.amount_pkr, 0);
  const spend = Number(st.ad_spend_pkr || 0);
  const allTime = range.key === "all";                            // ad spend is a lifetime figure, so cost per student only makes sense for all time
  const awaiting = pay.data?.length ?? 0;
  const completion = rows.length ? Math.round((rows.filter((r) => r.status === "verified").length / rows.length) * 100) : 0;

  // distinct sessions per funnel step
  const sessions: Record<string, Set<string>> = {};
  const traffic: Record<string, Set<string>> = {};
  const shares: Record<string, number> = {};
  for (const e of events) {
    (sessions[e.name] ??= new Set()).add(e.session_id);
    if (e.name === "landing_view") (traffic[e.source || "direct"] ??= new Set()).add(e.session_id);
    if (["share_whatsapp", "share_facebook", "share_copy", "share_native", "promise_support", "referral_visit"].includes(e.name)) shares[e.name] = (shares[e.name] || 0) + 1;
  }

  // ---- Sharing insight: per section and per sharer (an anonymous code = one browser; no names are ever collected)
  const SHARE_NAMES = ["share_whatsapp", "share_facebook", "share_copy", "share_native"];
  type SecAgg = { shares: number; wa: number; fb: number; copy: number; phone: number; people: Set<string>; visits: Set<string>; enrolled: number };
  const bySec = new Map<string, SecAgg>();
  const secOf = (k: string) => { if (!bySec.has(k)) bySec.set(k, { shares: 0, wa: 0, fb: 0, copy: 0, phone: 0, people: new Set(), visits: new Set(), enrolled: 0 }); return bySec.get(k)!; };
  for (const e of events) {
    if (SHARE_NAMES.includes(e.name)) {
      const o = secOf(e.section || "other"); o.shares++;
      if (e.name === "share_whatsapp") o.wa++; else if (e.name === "share_facebook") o.fb++; else if (e.name === "share_copy") o.copy++; else o.phone++;
      if (e.rf) o.people.add(e.rf);
    } else if (e.name === "landing_view") {
      if (e.section) secOf(e.section).visits.add(e.session_id);
    }
  }
  for (const r of rows) {
    const u = (r.utm ?? {}) as Record<string, string>;
    if (u.source === "share" && u.content) secOf(u.content).enrolled++;
  }
  const sectionRows = Array.from(bySec.entries()).sort((a, b) => b[1].shares - a[1].shares || b[1].visits.size - a[1].visits.size);
  const totalShares = sectionRows.reduce((a, [, o]) => a + o.shares, 0);
  const visitors = sessions.landing_view?.size ?? 0;
  // Unique visitors = different browsers (anonymous id stored in the browser). Visits from before the id existed count once per session.
  const byVisitor = new Map<string, Set<string>>();
  for (const e of events) {
    if (e.name !== "landing_view") continue;
    const k = e.visitor ? "v:" + e.visitor : "s:" + e.session_id;
    if (!byVisitor.has(k)) byVisitor.set(k, new Set());
    byVisitor.get(k)!.add(e.session_id);
  }
  const uniqueVisitors = byVisitor.size;
  const returningVisitors = Array.from(byVisitor.entries()).filter(([k, ss]) => k.startsWith("v:") && ss.size > 1).length;

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

  // Funnel rows: each step's unique visitors, scaled against the largest step.
  const steps = [...FUNNEL.map(([k, label]) => ({ label, n: sessions[k]?.size ?? 0 })), { label: "Verified purchases", n: verified.length }];
  const top = Math.max(1, ...steps.map((x) => x.n));
  const today = new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const engagement: [typeof Heart, string, number][] = [
    [Heart, "Promise supports", shares.promise_support || 0],
    [Share2, "WhatsApp shares", shares.share_whatsapp || 0],
    [Share2, "Facebook shares", shares.share_facebook || 0],
    [Share2, "Links copied", shares.share_copy || 0],
    [Share2, "Phone share menu", shares.share_native || 0],
    [Users, "Referral visits", shares.referral_visit || 0],
  ];

  // Response Challenge game (homepage #play): plays, finishes, shares, and the enrollments that came from it.
  // A visit counts as "from the game" when the link carried utm_campaign=response_challenge or was shared from the game itself.
  const fromGame = (r: Enr) => { const u = (r.utm ?? {}) as Record<string, string>; return u.campaign === "response_challenge" || (u.source === "share" && u.content === "play"); };
  const gamePlays = sessions.game_start?.size ?? 0, gameDone = sessions.game_complete?.size ?? 0;
  const gameShares = bySec.get("play")?.shares ?? 0;
  const gameEnrolled = rows.filter(fromGame).length;
  const challenge: [typeof Heart, string, string][] = [
    [Users, "Game started", gamePlays.toLocaleString("en-US")],
    [BadgeCheck, "Game completed", gameDone.toLocaleString("en-US")],
    [Percent, "Completion rate", gamePlays ? `${Math.round((gameDone / gamePlays) * 100)}%` : "—"],
    [Share2, "Game shares", gameShares.toLocaleString("en-US")],
    [Eye, "Visits from shares", (bySec.get("play")?.visits.size ?? 0).toLocaleString("en-US")],
    [Users, "Enrollments from game", gameEnrolled.toLocaleString("en-US")],
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{today}</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-navy md:text-4xl">Overview</h1>
        </div>
        <Link href="/admin/export" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:shadow-md">
          <Download size={16} /> Export enrollments (CSV)
        </Link>
      </div>

      <Flash sp={searchParams} />

      <RangeSelector range={range} />

      <section className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat icon={Eye} l="Unique visitors" v={uniqueVisitors.toLocaleString("en-US")} />
        <Stat icon={Repeat} l="Returning visitors" v={evs.hasVisitor ? returningVisitors.toLocaleString("en-US") : "—"} />
        <Stat icon={Users} l="Enrollments" v={String(rows.length)} />
        <Stat icon={Percent} l="Completion" v={`${completion}%`} />
        <Stat icon={Wallet} l="Revenue" v={formatPKR(revenue)} />
        <Stat icon={BadgeCheck} l="Paid students" v={String(verified.length)} />
        <Link href="/admin/payments" className="block">
          <Stat icon={CreditCard} l="To verify" v={String(awaiting)} hot={awaiting > 0} />
        </Link>
        <Stat icon={Megaphone} l="Cost / student" v={allTime && verified.length && spend ? formatPKR(spend / verified.length) : "—"} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Section title="Visitor funnel">
          <div className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <ol className="space-y-3.5">
              {steps.map((x, i) => {
                const prev = i > 0 ? steps[i - 1].n : 0;
                const pct = Math.round((x.n / top) * 100);
                const last = i === steps.length - 1;
                const conv = i > 0 && prev > 0 ? Math.round((x.n / prev) * 100) : null;
                return (
                  <li key={x.label} title={`${x.label}: ${x.n}${conv !== null ? ` (${conv}% of previous step)` : ""}`}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                      <span className={`font-medium ${last ? "text-navy" : "text-slate-700"}`}>{x.label}</span>
                      <span className="flex items-baseline gap-2">
                        {conv !== null && <span className="text-xs text-slate-500">{conv}% of previous</span>}
                        <b className="tabular-nums text-navy">{x.n.toLocaleString("en-US")}</b>
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${last ? "bg-gold" : "bg-[#0E7C5A]"}`} style={{ width: `${x.n ? Math.max(pct, 1.5) : 0}%` }} />
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
              Cost per website visitor: <b className="text-slate-700">{allTime && visitors && spend ? formatPKR(spend / visitors) : "—"}</b> · Visitors who started enrolling: <b className="text-slate-700">{visitors ? Math.round((rows.length / visitors) * 100) : 0}%</b>
            </p>
          </div>
        </Section>

        <Section title="Engagement">
          <div className="grid grid-cols-2 gap-3">
            {engagement.map(([Icon, label, n]) => (
              <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-50 text-[#a77d0c]"><Icon size={16} /></span>
                <p className="mt-3 text-2xl font-bold tabular-nums text-navy">{n.toLocaleString("en-US")}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Response Challenge game">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {challenge.map(([Icon, label, v]) => (
            <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-50 text-[#a77d0c]"><Icon size={16} /></span>
              <p className="mt-3 text-2xl font-bold tabular-nums text-navy">{v}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sharing by section">
        {!evs.detailed && (
          <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            To see which section each share was from, run the latest database update (<code>supabase/schema.sql</code>) once. New shares are recorded with their section after that.
          </p>
        )}
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[40rem] text-sm">
            <thead><tr className="text-left"><th className="p-3 pl-5">Section</th><th className="p-3 text-right">Shares</th><th className="p-3 text-right">WhatsApp</th><th className="p-3 text-right">Facebook</th><th className="p-3 text-right">Copy link</th><th className="p-3 text-right">Phone menu</th><th className="p-3 text-right">People</th><th className="p-3 text-right">Visits brought</th><th className="p-3 pr-5 text-right">Enrollments</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {sectionRows.map(([k, o]) => (
                <tr key={k}><td className="p-3 pl-5 font-medium text-navy">{k === "other" ? "Not recorded" : sectionName(k)}</td><td className="p-3 text-right font-semibold tabular-nums text-navy">{o.shares}</td><td className="p-3 text-right tabular-nums">{o.wa}</td><td className="p-3 text-right tabular-nums">{o.fb}</td><td className="p-3 text-right tabular-nums">{o.copy}</td><td className="p-3 text-right tabular-nums">{o.phone}</td><td className="p-3 text-right tabular-nums">{o.people.size}</td><td className="p-3 text-right tabular-nums">{o.visits.size}</td><td className="p-3 pr-5 text-right tabular-nums">{o.enrolled}</td></tr>
              ))}
              {!sectionRows.length && <tr><td className="p-6 text-center text-slate-500" colSpan={9}>No shares in this period yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Advertising sources and referrals">
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[34rem] text-sm">
            <thead><tr className="text-left"><th className="p-3 pl-5">Source / campaign</th><th className="p-3 text-right">Visitors</th><th className="p-3 text-right">Enrollments</th><th className="p-3 text-right">Paid</th><th className="p-3 pr-5 text-right">Revenue</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map(([k, o]) => <tr key={k}><td className="p-3 pl-5 font-medium text-navy">{k}</td><td className="p-3 text-right tabular-nums">{o.visitors}</td><td className="p-3 text-right tabular-nums">{o.enrolled}</td><td className="p-3 text-right tabular-nums">{o.paid}</td><td className="p-3 pr-5 text-right font-semibold tabular-nums text-navy">{formatPKR(o.revenue)}</td></tr>)}
              {!sources.length && <tr><td className="p-6 text-center text-slate-500" colSpan={5}>No traffic recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Revenue by package" action={<Link href="/admin/enrollments" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">All enrollments <ArrowRight size={14} /></Link>}>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[28rem] text-sm">
            <thead><tr className="text-left"><th className="p-3 pl-5">Service · class type · package</th><th className="p-3 text-right">Students</th><th className="p-3 pr-5 text-right">Revenue</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from(byPlan.entries()).map(([k, o]) => <tr key={k}><td className="p-3 pl-5 font-medium text-navy">{k}</td><td className="p-3 text-right tabular-nums">{o.n}</td><td className="p-3 pr-5 text-right font-semibold tabular-nums text-navy">{formatPKR(o.revenue)}</td></tr>)}
              {!byPlan.size && <tr><td className="p-6 text-center text-slate-500" colSpan={3}>No verified payments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
