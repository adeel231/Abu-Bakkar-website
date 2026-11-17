import QuranShell from "@/components/quran/QuranShell";
import { FinalCta, Hero, Schema, Section, meta } from "@/components/quran/parts";
import type { SeoPage } from "@/lib/quran";

const PAGE: SeoPage = { path: "/quran/teachers", title: "Our Quran Teachers | Abu Bakkar Academy", description: "How we select and verify our online Quran teachers. Profiles are published once qualifications and identity are verified.", h1: "Our Quran Teachers", priority: "P0" };
export const metadata = meta(PAGE);

/** Add verified teachers here only. Never add a name, photo or qualification that has not been checked. */
const TEACHERS: { name: string; gender: string; qualifications: string; languages: string; experience: string; programmes: string }[] = [];

export default function Teachers() {
  return (
    <QuranShell>
      <Schema page={PAGE} name="Teachers" />
      <Hero photo={false} h1={PAGE.h1} sub="Profiles are published only after verification." />
      {TEACHERS.length === 0 ? (
        <Section title="Profiles coming soon"><p>Verified teacher profiles will appear here before lessons begin.</p></Section>
      ) : (
        <Section tone="alt" title="Meet the teachers"><div className="grid gap-4 sm:grid-cols-2">{TEACHERS.map((t) => (
          <article key={t.name} className="rounded-2xl border border-slate-200 p-5"><h3 className="font-serif text-xl font-bold">{t.name}</h3><dl className="mt-2 space-y-1 text-sm"><div><dt className="inline font-semibold">Qualifications: </dt><dd className="inline">{t.qualifications}</dd></div><div><dt className="inline font-semibold">Languages: </dt><dd className="inline">{t.languages}</dd></div><div><dt className="inline font-semibold">Experience: </dt><dd className="inline">{t.experience}</dd></div><div><dt className="inline font-semibold">Programmes: </dt><dd className="inline">{t.programmes}</dd></div></dl></article>))}</div></Section>
      )}
      <FinalCta />
    </QuranShell>
  );
}
