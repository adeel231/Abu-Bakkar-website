import QuranShell from "@/components/quran/QuranShell";
import { Bullets, Faq, FinalCta, Hero, ProgramCards, Schema, Section, meta } from "@/components/quran/parts";
import type { SeoPage } from "@/lib/quran";

// Wording follows the searches Search Console shows for this page:
// "online quran classes for kids", "learn quran online for kids", "online quran tutor/teacher for kids".
const PAGE: SeoPage = { path: "/quran/kids", title: "Online Quran Classes for Kids | Learn Quran Online with a Tutor", description: "Kids learn Quran online with a patient one-to-one Quran tutor, from Noorani Qaida to fluent reading. Short lessons, parent updates, free assessment.", h1: "Online Quran Classes for Kids", priority: "P0" };
export const metadata = meta(PAGE);

const KIDS_FAQ: [string, string][] = [
  ["What age can my child start learning Quran online?", "Most children start around 4–6, but readiness matters more than age. The free assessment shows where to begin."],
  ["Will my child have the same Quran teacher each time?", "Yes, where possible. Children learn better with a teacher they know."],
  ["Can my child have a female Quran teacher?", "Yes. Ask when you book and we confirm availability before you pay."],
  ["How many Quran classes per week does a child need?", "Most children do well with 2 or 3 lessons a week. The teacher suggests a plan after the assessment."],
];

export default function Kids() {
  return (
    <QuranShell>
      <Schema page={PAGE} name="Kids" />
      <Hero h1={PAGE.h1} sub="Your child learns Quran online with a patient one-to-one Quran tutor, at times that suit your family." />
      <Section title="What your child learns">
        <Bullets items={["Noorani Qaida: Arabic letters and their sounds", "Nazra: reading the Quran fluently", "Tajweed: correct pronunciation"]} />
      </Section>
      <Section tone="alt" title="How our Quran teachers teach kids">
        <Bullets items={["Short lessons of about 30 minutes", "The same teacher where possible", "Clear reading milestones", "Parents can sit in and follow progress"]} />
      </Section>
      <Section title="Student safety"><p>Parents control class access. Teachers never arrange lessons or payments with children.</p></Section>
      <Section tone="alt" title="Programmes"><ProgramCards /></Section>
      <Section title="Questions parents ask"><Faq items={KIDS_FAQ} /></Section>
      <FinalCta />
    </QuranShell>
  );
}
