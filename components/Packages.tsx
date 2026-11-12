import { Check, GraduationCap, ShieldCheck, User, Users } from "lucide-react";
import { EnrollLink } from "./Tracker";
import ShareButton from "./ShareButton";
import {
  CLASS_TYPE_BLURB, CLASS_TYPE_LABEL, formatPKR, isLimited, monthlyPackage, plan, seatsFor, type ClassType,
} from "@/lib/pricing";
import type { Catalog } from "@/lib/db";

const TYPES: ClassType[] = ["group", "private"];
/** Only the Group plan is shown for Character Grooming. */
const CHARACTER_TYPES: ClassType[] = ["group"];

/** What a Character Grooming family gets. Only things the academy already promises on the site (no invented extras). Keep copy free of commas. */
const INCLUDED: string[] = [
  "Live interactive classes with a teacher",
  "Real life character practice: respect and patience and honesty",
  "Confidence and speaking practice through role play",
  "Islamic values explained with everyday examples",
  "Small practical activities to try at home",
  "Parent guidance and feedback",
  "Boys and girls welcome in age based groups",
];

function status(c: Catalog, programId: string, type: ClassType, withGroups: boolean) {
  const combos = withGroups ? c.ageGroups.map((g) => seatsFor(c.batches, programId, type, g.id)) : [seatsFor(c.batches, programId, type, null)];
  return {
    full: combos.length > 0 && combos.every((s) => s.hasBatches && s.left <= 0),
    limited: combos.some((s) => isLimited(s.hasBatches, s.left, c.threshold)),
  };
}

const Tag = ({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "red" }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone === "gold" ? "bg-gold text-navy" : "bg-red-100 text-red-700"}`}>{children}</span>
);

/** Character Grooming: the Group plan card with its monthly price. */
export function CharacterPackages({ c, wa }: { c: Catalog; wa: string }) {
  const prog = c.programs.find((p) => p.kind === "character");
  if (!prog) return null;
  return (
    <section id="packages" className="relative bg-white text-navy">
      <ShareButton id="packages" corner="top-right" title="Character Grooming packages"
        text={`Online Group classes from ${formatPKR(monthlyPackage(c.packages, prog.id, "group")?.price_pkr ?? 6000).replace(/,/g, "")} per month.`} />
      <div className="section">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-gold">Character Grooming</p>
        <h2 className="h2 mt-2 text-center">Choose Your Package</h2>

        <div className="mx-auto mt-10 grid max-w-xl gap-6">
          {CHARACTER_TYPES.map((t) => {
            const monthly = monthlyPackage(c.packages, prog.id, t);
            if (!monthly) return null;
            const st = status(c, prog.id, t, true);
            return (
              <div key={t} className={`flex flex-col rounded-3xl border-2 bg-white p-6 shadow-sm md:p-8 ${t === "group" ? "border-gold" : "border-slate-200"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {t === "group" ? <Users className="text-emerald-700" /> : <User className="text-emerald-700" />}
                  <h3 className="font-serif text-2xl font-bold">{CLASS_TYPE_LABEL[t]}</h3>
                  {t === "group" && <Tag>Most popular</Tag>}
                  {st.full ? <Tag tone="red">Seats full</Tag> : st.limited ? <Tag>Limited seats</Tag> : null}
                </div>
                <p className="mt-2 text-slate-600">{CLASS_TYPE_BLURB[t]}</p>

                <p className="mt-6 font-serif text-4xl font-extrabold sm:text-5xl">{formatPKR(monthly.price_pkr)}<span className="ml-2 whitespace-nowrap font-sans text-lg font-medium text-slate-500">/ month</span></p>
                <ul className="mt-4 space-y-2 text-slate-700">
                  {monthly.schedule_note.split("·").map((x) => x.trim()).filter(Boolean).map((x) => (
                    <li key={x} className="flex items-start gap-2 font-semibold text-navy"><Check size={18} className="mt-0.5 shrink-0 text-emerald" />{x}</li>
                  ))}
                </ul>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">What your child gets</p>
                  <ul className="mt-3 space-y-2 text-slate-700">
                    {INCLUDED.map((x) => (
                      <li key={x} className="flex items-start gap-2"><Check size={18} className="mt-0.5 shrink-0 text-emerald" />{x}</li>
                    ))}
                  </ul>
                </div>

                <p className="mt-5 flex items-start gap-2 text-sm text-slate-600">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald" />
                  Full refund if we cannot start your class. You see the total before you pay.
                </p>

                <div className="mt-auto pt-6">
                  {st.full ? (
                    <a href={`https://wa.me/${wa}?text=${encodeURIComponent("Assalamu Alaikum, please add my child to the waiting list for " + CLASS_TYPE_LABEL[t] + " Character Grooming.")}`} className="btn w-full bg-slate-100 text-slate-700">Join waiting list on WhatsApp</a>
                  ) : (
                    <EnrollLink href={`/enroll?program=${prog.slug}&type=${t}`} className="btn-gold w-full">Enroll — {formatPKR(monthly.price_pkr)} / month</EnrollLink>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** The three age groups, shown before enrollment. */
export function AgeGroups({ c }: { c: Catalog }) {
  return (
    <section id="age-groups" className="relative bg-slate-50 text-navy">
      <ShareButton id="age-groups" corner="top-right" title="Age groups at Abu Bakkar Academy" text="Group A for ages 5 to 8. Group B for ages 8 to 12. Group C for ages 12 to 15. Find the right group for your child." />
      <div className="section">
        <h2 className="h2 text-center">Age Groups</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {c.ageGroups.map((g) => (
            <div key={g.id} className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="font-serif text-4xl font-extrabold text-gold">{g.code}</p>
              <h3 className="mt-1 text-lg font-bold">Ages {g.min_age} to {g.max_age}</h3>
              <p className="mt-2 text-sm text-slate-600"><b className="text-navy">Focus:</b> {g.focus}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Academic Tuition: a separate second service. */
export function TuitionPackages({ c, wa }: { c: Catalog; wa: string }) {
  const prog = c.programs.find((p) => p.kind === "tuition");
  if (!prog) return null;
  return (
    <section id="tuition" className="bg-white text-navy">
      <div className="section">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-gold">Second service</p>
        <h2 className="h2 mt-2 text-center">Academic Tuition</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">Online tuition for school subjects, taught separately from Character Grooming. Choose your school grade and the subject you need. Each package is 12 live sessions per month.</p>
        <div className="mx-auto mt-8 grid max-w-4xl gap-6 md:grid-cols-2">
          {TYPES.map((t) => {
            const pk = plan(c.packages, prog.id, t)[0];
            if (!pk) return null;
            const st = status(c, prog.id, t, false);
            return (
              <div key={t} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <GraduationCap className="text-emerald-700" />
                  <h3 className="font-serif text-2xl font-bold">{CLASS_TYPE_LABEL[t]}</h3>
                  {st.full ? <Tag tone="red">Seats full</Tag> : st.limited ? <Tag>Limited seats</Tag> : null}
                </div>
                <p className="mt-5 font-serif text-4xl font-extrabold">{formatPKR(pk.price_pkr)}<span className="ml-2 font-sans text-base font-medium text-slate-500">per month</span></p>
                <ul className="mt-4 space-y-2 text-slate-700">
                  <li className="flex items-start gap-2"><Check size={18} className="mt-0.5 shrink-0 text-emerald" />{pk.sessions ?? 12} live online sessions</li>
                  <li className="flex items-start gap-2"><Check size={18} className="mt-0.5 shrink-0 text-emerald" />Select your school grade and subject</li>
                  <li className="flex items-start gap-2"><Check size={18} className="mt-0.5 shrink-0 text-emerald" />{t === "group" ? "Small group lessons" : "One-on-one lessons with the teacher"}</li>
                </ul>
                <div className="mt-auto pt-6">
                  {st.full ? (
                    <a href={`https://wa.me/${wa}`} className="btn w-full bg-slate-100 text-slate-700">Join waiting list on WhatsApp</a>
                  ) : (
                    <EnrollLink href={`/enroll?program=${prog.slug}&type=${t}`} className="btn-emerald w-full">Enroll in Tuition — {formatPKR(pk.price_pkr)}</EnrollLink>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
