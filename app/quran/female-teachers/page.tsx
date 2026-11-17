import QuranShell from "@/components/quran/QuranShell";
import { Bullets, FinalCta, Hero, Schema, Section, meta } from "@/components/quran/parts";
import type { SeoPage } from "@/lib/quran";

const PAGE: SeoPage = { path: "/quran/female-teachers", title: "Female Quran Teacher Online | Qaria for Kids & Women", description: "Request a female Quran teacher (Qaria) for one-to-one online lessons for girls, children and women. Free assessment, availability confirmed before you pay.", h1: "Female Quran Teachers Online", priority: "P0" };
export const metadata = meta(PAGE);

export default function Female() {
  return (
    <QuranShell>
      <Schema page={PAGE} name="Female teachers" />
      <Hero h1={PAGE.h1} sub="Ask for a female teacher (Qaria) when you book and we will match you to an available Qaria." />
      <Section title="What you can expect"><Bullets items={["Verified qualifications and experience", "Languages shown on each profile", "Lessons for girls, young children and women"]} /></Section>
      <Section tone="alt" title="Availability"><p>We confirm which times a Qaria can teach before you pay. Profiles appear on the <a className="underline" href="/quran/teachers">teachers page</a> once verified.</p></Section>
      <FinalCta />
    </QuranShell>
  );
}
