import QuranShell from "@/components/quran/QuranShell";
import { Bullets, Faq, FinalCta, Hero, HowItWorks, PricingTable, ProgramCards, Schema, Section, meta, ReportSection, StatsStrip } from "@/components/quran/parts";
import { COMMON_FAQ, type SeoPage } from "@/lib/quran";

const PAGE: SeoPage = { path: "/quran/uk", title: "Online Quran Classes UK | 1-to-1 Quran Lessons", description: "One-to-one online Quran lessons for UK children and adults. Noorani Qaida, Nazra, Tajweed and Hifz. Prices in GBP and UK lesson times. Free assessment.", h1: "Online Quran Classes in the UK for Kids & Adults", priority: "P0" };
export const metadata = meta(PAGE, { "en-GB": "/quran/uk", "en-US": "/quran/usa" });

const UK_FAQ: [string, string][] = [
  ["Are your teachers based in the UK?", "No. They teach online from Pakistan, at times that suit UK families."],
  ["What time zone are lessons in?", "UK time (GMT or BST). We adjust when the clocks change."],
  ...COMMON_FAQ.slice(0, 1),
  ...COMMON_FAQ.slice(3),
];

export default function UkPage() {
  return (
    <QuranShell region="uk">
      <Schema page={PAGE} name="UK" />
      <Hero h1={PAGE.h1} region="uk" sub="Live one-to-one lessons with male and female Quran teachers. Prices in pounds, lesson times in UK time." />
      <StatsStrip />
      <Section title="Quran lessons for UK families">
        <Bullets items={["Prices in GBP, billed monthly", "Lesson times in GMT / BST", "Male and female teachers"]} />
      </Section>
      <Section tone="alt" title="Programmes"><ProgramCards /></Section>
      <Section title="UK monthly plans (GBP)" id="pricing"><PricingTable region="uk" /></Section>
      <Section tone="alt" title="How lessons work"><HowItWorks /></Section>
      <ReportSection />
      <Section title="UK parent questions"><Faq items={UK_FAQ} /></Section>
      <FinalCta />
    </QuranShell>
  );
}
