import QuranShell from "@/components/quran/QuranShell";
import { Bullets, CTA2, Faq, FinalCta, Hero, HowItWorks, ProgramCards, ReportSection, Schema, Section, StatsStrip, meta } from "@/components/quran/parts";
import type { SeoPage } from "@/lib/quran";

const PAGE: SeoPage = { path: "/quran", title: "Online Quran Classes for Kids & Adults | Abu Bakkar Academy", description: "Live one-to-one online Quran classes: Noorani Qaida, Nazra, Tajweed and Hifz with qualified male and female teachers. Book a free assessment.", h1: "Online Quran Classes for Kids & Adults", priority: "P0" };
export const metadata = meta(PAGE);

export default function QuranHub() {
  return (
    <QuranShell>
      <Schema page={PAGE} />
      <Hero h1={PAGE.h1} sub="Live one-to-one lessons in Noorani Qaida, Nazra, Tajweed and Hifz with qualified male and female teachers." />
      <StatsStrip />
      <Section title="Why families choose us">
        <Bullets items={["Live one-to-one lessons", "Male and female teachers", "Parent-controlled class access"]} />
      </Section>
      <Section tone="alt" title="Quran programmes"><ProgramCards /></Section>
      <Section title="How it works"><HowItWorks /></Section>
      <Section tone="alt" title="Monthly pricing">
        <div className="flex flex-wrap gap-3"><CTA2 href="/quran/uk#pricing">UK prices (£)</CTA2><CTA2 href="/quran/usa#pricing">USA prices ($)</CTA2></div>
      </Section>
      <ReportSection />
      <Section tone="alt" title="Questions"><Faq /></Section>
      <FinalCta />
    </QuranShell>
  );
}
