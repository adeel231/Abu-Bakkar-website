import QuranShell from "@/components/quran/QuranShell";
import { Bullets, FinalCta, Hero, ProgramCards, Schema, Section, meta } from "@/components/quran/parts";
import type { SeoPage } from "@/lib/quran";

const PAGE: SeoPage = { path: "/quran/kids", title: "Online Quran Classes for Kids | Quran Tutor for Children", description: "Gentle one-to-one online Quran lessons for children, from Noorani Qaida to fluent reading. Short lessons, parent involvement, free assessment.", h1: "Online Quran Classes for Kids", priority: "P0" };
export const metadata = meta(PAGE);

export default function Kids() {
  return (
    <QuranShell>
      <Schema page={PAGE} name="Kids" />
      <Hero h1={PAGE.h1} sub="Gentle one-to-one lessons that help your child read the Quran with confidence." />
      <Section title="How we teach children"><Bullets items={["Short lessons of about 30 minutes", "The same teacher where possible", "Clear reading milestones", "Parents can sit in and follow progress"]} /></Section>
      <Section tone="alt" title="Starting age"><p>Most children start around 4–6, but readiness varies. The free assessment shows where to begin.</p></Section>
      <Section title="Student safety"><p>Parents control class access. Teachers never arrange lessons or payments with children.</p></Section>
      <Section tone="alt" title="Programmes"><ProgramCards /></Section>
      <FinalCta />
    </QuranShell>
  );
}
