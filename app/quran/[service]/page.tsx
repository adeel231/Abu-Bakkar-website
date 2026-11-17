import { notFound } from "next/navigation";
import QuranShell from "@/components/quran/QuranShell";
import { Bullets, Faq, FinalCta, Hero, Schema, Section, meta } from "@/components/quran/parts";
import { SERVICES } from "@/lib/quran";

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(SERVICES).map((service) => ({ service }));
export const generateMetadata = ({ params }: { params: { service: string } }) => {
  const s = SERVICES[params.service];
  return s ? meta(s.page) : {};
};

export default function Service({ params }: { params: { service: string } }) {
  const s = SERVICES[params.service];
  if (!s) notFound();
  return (
    <QuranShell>
      <Schema page={s.page} />
      <Hero photo={false} h1={s.page.h1} sub={s.intro} />
      <Section title="What you will learn"><Bullets items={s.points} /></Section>
      <Section tone="alt" title="Questions"><Faq items={s.faq} /></Section>
      <FinalCta />
    </QuranShell>
  );
}
