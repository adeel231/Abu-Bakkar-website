import Link from "next/link";
import QuranShell from "@/components/quran/QuranShell";
import { FinalCta, Hero, PricingTable, Schema, Section, meta } from "@/components/quran/parts";
import { REGIONS, type Region, type SeoPage } from "@/lib/quran";

const PAGE: SeoPage = { path: "/quran/pricing", title: "Online Quran Classes Pricing | UK £ and USA $ Plans", description: "Monthly plans for one-to-one online Quran lessons in GBP and USD. Free assessment, no registration fee, 10% sibling discount.", h1: "Online Quran Classes Pricing", priority: "P0" };
export const metadata = meta(PAGE);

export default function Pricing({ searchParams }: { searchParams: { region?: string } }) {
  const region: Region = searchParams.region === "us" ? "us" : "uk";   // a visible selector, never an IP redirect
  return (
    <QuranShell region={region}>
      <Schema page={PAGE} name="Pricing" />
      <Hero photo={false} h1={PAGE.h1} sub="Simple monthly plans. Start with a free assessment." />
      <Section title={`Prices in ${REGIONS[region].currency}`}>
        <div className="mb-4 flex gap-2">{(["uk", "us"] as Region[]).map((r) => <Link key={r} href={`/quran/pricing?region=${r}`} className={`rounded-full border px-4 py-1.5 font-semibold ${r === region ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300"}`}>{r === "uk" ? "United Kingdom (£)" : "United States ($)"}</Link>)}</div>
        <PricingTable region={region} />
        <p className="text-sm text-slate-500">Existing Character Grooming fees (Pakistan) are in PKR and are shown separately on the <Link className="underline" href="/#programs">Character Grooming page</Link>.</p>
      </Section>
      <FinalCta />
    </QuranShell>
  );
}
