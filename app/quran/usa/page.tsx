import QuranShell from "@/components/quran/QuranShell";
import { Bullets, Faq, FinalCta, Hero, HowItWorks, PricingTable, ProgramCards, Schema, Section, meta, ReportSection, StatsStrip } from "@/components/quran/parts";
import { COMMON_FAQ, type SeoPage } from "@/lib/quran";

const PAGE: SeoPage = { path: "/quran/usa", title: "Online Quran Classes USA | Private Quran Tutors", description: "Private one-to-one online Quran lessons for US children and adults with English-speaking teachers. Prices in USD. Free assessment.", h1: "Online Quran Classes in the USA with Private Tutors", priority: "P0" };
export const metadata = meta(PAGE, { "en-GB": "/quran/uk", "en-US": "/quran/usa" });

const US_FAQ: [string, string][] = [
  ["Which US time zones can you teach in?", "We confirm slots in your time zone when you book, and only offer times we can deliver."],
  ["Where are your teachers based?", "Online from Pakistan. They speak English."],
  ...COMMON_FAQ.slice(0, 1),
  ...COMMON_FAQ.slice(3),
];

export default function UsaPage() {
  return (
    <QuranShell region="us">
      <Schema page={PAGE} name="USA" />
      <Hero h1={PAGE.h1} region="us" sub="Live one-to-one lessons with English-speaking teachers. Prices in US dollars." />
      <StatsStrip />
      <Section title="Private Quran tutors for US families">
        <Bullets items={["Prices in USD, billed monthly", "English-speaking teachers", "Lesson times in your time zone"]} />
      </Section>
      <Section tone="alt" title="Programmes"><ProgramCards /></Section>
      <Section title="USA monthly plans (USD)" id="pricing"><PricingTable region="us" /></Section>
      <Section tone="alt" title="How lessons work"><HowItWorks /></Section>
      <ReportSection />
      <Section title="US parent questions"><Faq items={US_FAQ} /></Section>
      <FinalCta />
    </QuranShell>
  );
}
