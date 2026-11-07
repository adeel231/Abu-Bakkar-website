import { db } from "@/lib/db";
import { CLASS_TYPE_LABEL } from "@/lib/pricing";
import { saveAgeGroup, saveSubject, updatePackage, updateProgram } from "../../actions";
import { Field, Flash, Section } from "../ui";

export const dynamic = "force-dynamic";

export default async function Packages({ searchParams }: { searchParams: { msg?: string; err?: string } }) {
  const c = db();
  const [pr, pk, ag, sb] = await Promise.all([
    c.from("programs").select("*").order("sort"), c.from("packages").select("*").order("sort"),
    c.from("age_groups").select("*").order("sort"), c.from("subjects").select("*").order("sort"),
  ]);
  const programs = (pr.data ?? []) as any[], packages = (pk.data ?? []) as any[];

  return (
    <>
      <Flash sp={searchParams} />
      <p className="rounded-xl bg-gold/15 p-3 text-sm text-navy">Changing a price here updates the website and checkout straight away, for <b>new</b> enrollments only. Every existing enrollment keeps the fee that was charged at its checkout.</p>

      {programs.map((p) => (
        <Section key={p.id} title={p.name}>
          <form action={updateProgram} className="mb-3 grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[1fr_2fr_10rem_auto] md:items-end">
            <input type="hidden" name="id" value={p.id} />
            <Field n="name" l="Service name" v={p.name} req /><Field n="description" l="Description" v={p.description} />
            <div><label className="label">Status</label><select name="status" defaultValue={p.status} className="input !py-2"><option value="open">open</option><option value="coming_soon">coming soon</option><option value="closed">closed (hidden)</option></select></div>
            <button className="btn-emerald !py-2">Save</button>
          </form>
          <div className="space-y-2">
            {packages.filter((k) => k.program_id === p.id).map((k) => (
              <form key={k.id} action={updatePackage} className="grid items-end gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[10rem_8rem_1fr_auto_auto]">
                <input type="hidden" name="id" value={k.id} />
                <div><p className="label">{CLASS_TYPE_LABEL[k.class_type as "group" | "private"]}</p><input name="label" defaultValue={k.label} className="input !py-2" /></div>
                <Field n="price_pkr" l="Price (PKR)" v={k.price_pkr} t="number" req />
                <Field n="schedule_note" l="Schedule note" v={k.schedule_note} />
                <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="active" defaultChecked={k.active} /> Active</label>
                <button className="btn-emerald !py-2">Save</button>
              </form>
            ))}
          </div>
        </Section>
      ))}

      <Section title="Age groups">
        <div className="space-y-2">
          {((ag.data ?? []) as any[]).map((g) => (
            <form key={g.id} action={saveAgeGroup} className="grid items-end gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[6rem_7rem_6rem_6rem_1fr_auto_auto]">
              <input type="hidden" name="id" value={g.id} /><input type="hidden" name="code" value={g.code} />
              <Field n="label" l="Name" v={g.label} /><div><p className="label">Code</p><p className="py-2 font-bold">{g.code}</p></div>
              <Field n="min_age" l="Min age" v={g.min_age} t="number" req /><Field n="max_age" l="Max age" v={g.max_age} t="number" req />
              <Field n="focus" l="Focus" v={g.focus} />
              <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="active" defaultChecked={g.active} /> Active</label>
              <button className="btn-emerald !py-2">Save</button>
            </form>
          ))}
          <form action={saveAgeGroup} className="grid items-end gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-4 md:grid-cols-[6rem_7rem_6rem_6rem_1fr_auto]">
            <Field n="code" l="New code" /><Field n="label" l="Name" /><Field n="min_age" l="Min age" t="number" req /><Field n="max_age" l="Max age" t="number" req /><Field n="focus" l="Focus" />
            <input type="hidden" name="active" value="on" /><button className="btn-emerald !py-2">Add</button>
          </form>
        </div>
      </Section>

      <Section title="Tuition subjects">
        <div className="grid gap-2 md:grid-cols-2">
          {((sb.data ?? []) as any[]).map((s) => (
            <form key={s.id} action={saveSubject} className="flex items-end gap-2 rounded-2xl bg-white p-3 shadow-sm">
              <input type="hidden" name="id" value={s.id} /><div className="flex-1"><input name="name" defaultValue={s.name} className="input !py-2" /></div>
              <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="active" defaultChecked={s.active} /> Active</label>
              <button className="btn-emerald !py-2">Save</button>
            </form>
          ))}
          <form action={saveSubject} className="flex items-end gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-3">
            <div className="flex-1"><input name="name" placeholder="New subject" className="input !py-2" /></div><button className="btn-emerald !py-2">Add</button>
          </form>
        </div>
      </Section>
    </>
  );
}
