import { db } from "@/lib/db";
import { LEAD_LABEL, LEAD_STATUSES } from "@/lib/quran";
import { updateQuranLead } from "../../actions";
import { Flash, Section, waLink, when } from "../ui";

export const dynamic = "force-dynamic";
const HOUR = 36e5;

type Lead = {
  id: string; created_at: string; status: string; parent_name: string; email: string; whatsapp: string; country: string; time_zone: string;
  student_name: string; age_band: string; level: string; teacher_pref: string; preferred_time: string; landing_page: string | null; source: string | null;
  selected_plan: string | null; trial_at: string | null; recommended_level: string | null; recommended_plan: string | null; admin_notes: string | null;
};

export default async function QuranLeads({ searchParams }: { searchParams: { status?: string; msg?: string; err?: string } }) {
  const status = LEAD_STATUSES.includes(searchParams.status as never) ? searchParams.status! : "all";
  let q = db().from("quran_leads").select("*").order("created_at", { ascending: false }).limit(500);
  if (status !== "all") q = q.eq("status", status);
  const rows = ((await q).data ?? []) as Lead[];
  const all = ((await db().from("quran_leads").select("status,country,landing_page,source,selected_plan,recommended_plan").limit(5000)).data ?? []) as Pick<Lead, "status" | "country" | "landing_page" | "source" | "selected_plan" | "recommended_plan">[];
  // Funnel: a lead that reached a later stage counts in every earlier one (cancelled leads are counted as inquiries only).
  const rank: Record<string, number> = { new_inquiry: 0, trial_booked: 1, trial_attended: 2, package_recommended: 3, payment_pending: 4, paying_student: 5, retained: 6 };
  const reached = (rs: typeof all, from: number) => rs.filter((r) => (rank[r.status] ?? -1) >= from).length;
  const STAGES: [string, number][] = [["Inquiries", 0], ["Trials booked", 1], ["Trials attended", 2], ["Paying students", 5], ["Retained", 6]];
  const group = (key: "country" | "landing_page" | "source" | "recommended_plan") => {
    const m = new Map<string, typeof all>();
    for (const r of all) { const k = (r[key] as string | null) || "(none)"; m.set(k, [...(m.get(k) ?? []), r]); }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length).slice(0, 8);
  };
  const now = Date.now();
  // Alerts: inquiries nobody has moved on for 24h, and trials whose time has passed without being marked attended.
  const unanswered = rows.filter((r) => r.status === "new_inquiry" && now - Date.parse(r.created_at) > 24 * HOUR).length;
  const missed = rows.filter((r) => r.status === "trial_booked" && r.trial_at && Date.parse(r.trial_at) < now - HOUR).length;

  return (
    <>
      <Flash sp={searchParams} />
      <Section title="Quran leads">
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STAGES.map(([l, n]) => <div key={l} className="rounded-xl bg-white p-3 text-center shadow-sm"><p className="text-2xl font-bold text-navy">{reached(all, n)}</p><p className="text-xs text-slate-500">{l}</p></div>)}
        </div>
        <div className="mb-5 grid gap-3 md:grid-cols-2">
          {([["By country", "country"], ["By landing page", "landing_page"], ["By source", "source"], ["By recommended plan", "recommended_plan"]] as const).map(([t, k]) => (
            <table key={k} className="w-full rounded-xl bg-white text-sm shadow-sm"><thead><tr className="text-left text-slate-500"><th className="p-2">{t}</th><th>Inq.</th><th>Trial</th><th>Attended</th><th>Paying</th></tr></thead>
              <tbody>{group(k).map(([g, rs]) => <tr key={g} className="border-t"><td className="p-2">{g}</td><td>{rs.length}</td><td>{reached(rs, 1)}</td><td>{reached(rs, 2)}</td><td>{reached(rs, 5)}</td></tr>)}</tbody></table>
          ))}
        </div>
        {(unanswered > 0 || missed > 0) && (
          <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
            {unanswered > 0 && `${unanswered} inquiry(ies) unanswered for over 24 hours. `}{missed > 0 && `${missed} trial(s) past their time and not marked attended.`}
          </p>
        )}
        <form className="mb-4 flex gap-2" method="get">
          <select name="status" defaultValue={status} className="input !w-56 !py-2"><option value="all">All statuses</option>{LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_LABEL[s]}</option>)}</select>
          <button className="btn-emerald !py-2">Filter</button>
        </form>
        <div className="space-y-3">
          {rows.map((r) => (
            <details key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1">
                <b>{r.parent_name}</b><span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold">{LEAD_LABEL[r.status]}</span>
                <span>{r.student_name} ({r.age_band})</span><span className="text-slate-500">{r.country}</span><span className="ml-auto text-sm text-slate-500">{when(r.created_at)}</span>
              </summary>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className="space-y-1 text-sm">
                  <p>WhatsApp: <a className="underline" href={waLink(r.whatsapp.replace(/\D/g, ""), `Assalamu Alaikum ${r.parent_name}, this is Abu Bakkar Academy about the free Quran assessment for ${r.student_name}.`)} target="_blank" rel="noopener">{r.whatsapp}</a> · {r.email}</p>
                  <p>Time zone: {r.time_zone} · Preferred: {r.preferred_time}</p>
                  <p>Level: {r.level} · Teacher: {r.teacher_pref}</p>
                  <p>Source: {r.source || "direct"} · Landing: {r.landing_page || "—"}</p>
                </div>
                <form action={updateQuranLead} className="space-y-2 text-sm">
                  <input type="hidden" name="id" value={r.id} />
                  <select name="status" defaultValue={r.status} className="input !py-2">{LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_LABEL[s]}</option>)}</select>
                  <label className="label">Trial date and time (UTC)</label>
                  <input name="trial_at" type="datetime-local" defaultValue={r.trial_at ? r.trial_at.slice(0, 16) : ""} className="input !py-2" />
                  <input name="recommended_level" placeholder="Recommended level" defaultValue={r.recommended_level ?? ""} className="input !py-2" />
                  <input name="recommended_plan" placeholder="Recommended plan" defaultValue={r.recommended_plan ?? ""} className="input !py-2" />
                  <textarea name="admin_notes" placeholder="Notes" defaultValue={r.admin_notes ?? ""} className="input !py-2" rows={2} />
                  <button className="btn-emerald !py-2">Save</button>
                </form>
              </div>
            </details>
          ))}
          {rows.length === 0 && <p className="text-slate-500">No leads yet.</p>}
        </div>
      </Section>
    </>
  );
}
