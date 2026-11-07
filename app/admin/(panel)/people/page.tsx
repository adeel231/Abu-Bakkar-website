import { db } from "@/lib/db";
import { formatPKR } from "@/lib/pricing";
import { Badge, Section, waLink, when } from "../ui";

export const dynamic = "force-dynamic";

export default async function People({ searchParams }: { searchParams: { q?: string } }) {
  const term = (searchParams.q || "").trim().toLowerCase();
  const c = db();
  const [pr, st, en] = await Promise.all([
    c.from("parents").select("*").order("created_at", { ascending: false }).limit(2000),
    c.from("students").select("*").limit(5000),
    c.from("enrollments").select("id,ref,parent_id,student_id,status,program_name,class_type,package_label,amount_pkr").limit(5000),
  ]);
  let parents = (pr.data ?? []) as any[];
  const students = (st.data ?? []) as any[];
  const enrs = (en.data ?? []) as any[];
  if (term) parents = parents.filter((p) => [p.full_name, p.whatsapp, p.email ?? "", p.city ?? ""].join(" ").toLowerCase().includes(term)
    || students.some((s) => s.parent_id === p.id && s.first_name.toLowerCase().includes(term)));
  parents = parents.slice(0, 200);

  return (
    <Section title={`Parents and students (${pr.data?.length ?? 0} parents, ${students.length} students)`}>
      <form className="mb-4 flex gap-2" method="get">
        <input name="q" defaultValue={searchParams.q} placeholder="Search parent, student, WhatsApp, city…" className="input !w-80 !py-2" />
        <button className="btn-emerald !py-2">Search</button>
      </form>
      <div className="grid gap-3 lg:grid-cols-2">
        {parents.map((p) => {
          const kids = students.filter((s) => s.parent_id === p.id);
          return (
            <div key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-bold text-navy">{p.full_name}</p><p className="text-sm text-slate-600">{p.whatsapp}{p.email ? ` · ${p.email}` : ""}{p.city ? ` · ${p.city}` : ""}</p></div>
                <a className="btn-emerald !py-1.5 text-sm" target="_blank" href={waLink(p.whatsapp, `Assalamu Alaikum ${p.full_name}, this is Abu Bakkar Academy.`)}>WhatsApp</a>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {kids.map((k) => (
                  <li key={k.id} className="rounded-xl bg-slate-50 p-3">
                    <b>{k.first_name}</b>, age {k.age}{k.school_grade ? `, ${k.school_grade}` : ""}
                    {enrs.filter((e) => e.student_id === k.id).map((e) => (
                      <p key={e.id} className="mt-1 flex flex-wrap items-center gap-2 text-slate-600"><Badge s={e.status} /> {e.ref} · {e.program_name} · {e.package_label} · {formatPKR(e.amount_pkr)}</p>
                    ))}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-400">First enquiry {when(p.created_at)}</p>
            </div>
          );
        })}
        {!parents.length && <p className="rounded-2xl bg-white p-4 text-slate-500 shadow-sm">No parents yet.</p>}
      </div>
    </Section>
  );
}
