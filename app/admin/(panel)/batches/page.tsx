import { db, type EnrollmentRow } from "@/lib/db";
import { saveBatch } from "../../actions";
import { Field, Flash, Section } from "../ui";

export const dynamic = "force-dynamic";

function BatchForm({ b, programs, groups }: { b?: any; programs: any[]; groups: any[] }) {
  return (
    <form action={saveBatch} className="space-y-2">
      {b && <input type="hidden" name="id" value={b.id} />}
      <div className="grid gap-2 sm:grid-cols-2">
        <Field n="name" l="Batch name" v={b?.name} req />
        <div><label className="label">Service</label><select name="program_id" defaultValue={b?.program_id} required className="input !py-2">{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div><label className="label">Class type</label><select name="class_type" defaultValue={b?.class_type ?? ""} className="input !py-2"><option value="">Any</option><option value="group">Online Group</option><option value="private">Private One-on-One</option></select></div>
        <div><label className="label">Age group</label><select name="age_group_id" defaultValue={b?.age_group_id ?? ""} className="input !py-2"><option value="">Any</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.label} ({g.min_age}–{g.max_age})</option>)}</select></div>
        <Field n="timing" l="Class timing (e.g. Mon–Fri 5:00–6:00 PM)" v={b?.timing} />
        <Field n="start_date" l="Start date" v={b?.start_date} t="date" />
        <Field n="capacity" l="Capacity (seats)" v={b?.capacity ?? 10} t="number" req />
        <Field n="teacher" l="Teacher" v={b?.teacher} />
      </div>
      <Field n="meeting_link" l="Class join link (Zoom / Meet)" v={b?.meeting_link} />
      {b && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={b.active} /> Active (offered for choosing and counted for seats)</label>}
      <button className="btn-emerald !py-2">{b ? "Save batch" : "Create batch"}</button>
    </form>
  );
}

export default async function Batches({ searchParams }: { searchParams: { msg?: string; err?: string } }) {
  const c = db();
  const [bt, pr, ag, en] = await Promise.all([
    c.from("class_batches").select("*").order("created_at", { ascending: false }),
    c.from("programs").select("id,name").order("sort"), c.from("age_groups").select("*").order("sort"),
    c.from("enrollments").select("child_first_name,child_age,class_batch_id,ref").eq("status", "verified").not("class_batch_id", "is", null),
  ]);
  const programs = pr.data ?? [], groups = ag.data ?? [];
  const students = (en.data ?? []) as Pick<EnrollmentRow, "child_first_name" | "child_age" | "class_batch_id" | "ref">[];
  return (
    <>
      <Flash sp={searchParams} />
      <Section title="Class batches (schedules, capacity and assigned students)">
        <details className="mb-4 rounded-2xl bg-white p-4 shadow-sm" open={!(bt.data?.length)}><summary className="cursor-pointer font-semibold text-navy">+ New batch</summary><div className="mt-3"><BatchForm programs={programs} groups={groups} /></div></details>
        <div className="grid gap-4 lg:grid-cols-2">
          {(bt.data ?? []).map((b: any) => {
            const mine = students.filter((s) => s.class_batch_id === b.id);
            return (
              <div key={b.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between"><p className="font-bold text-navy">{b.name}{b.active ? "" : " (inactive)"}</p><p className="text-sm font-semibold text-emerald-700">{mine.length} / {b.capacity} seats used</p></div>
                {mine.length > 0 && <p className="mt-1 text-sm text-slate-600">{mine.map((s) => `${s.child_first_name} (${s.child_age})`).join(", ")}</p>}
                <details className="mt-3"><summary className="cursor-pointer text-sm underline">Edit</summary><div className="mt-3"><BatchForm b={b} programs={programs} groups={groups} /></div></details>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}
