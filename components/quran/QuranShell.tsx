import Link from "next/link";
import { Logo } from "@/components/Brand";
import { REGIONS, type Region } from "@/lib/quran";
import { WHATSAPP } from "@/lib/contact";
import WhatsAppLink from "./WhatsAppLink";

const NAV: [string, string][] = [["/", "Home"], ["/#programs", "Character Grooming"], ["/quran", "Online Quran Classes"], ["/quran/teachers", "Our Teachers"], ["/quran/pricing", "Pricing"]];
const CLASSES: [string, string][] = [["/quran/kids", "Quran for Kids"], ["/quran/female-teachers", "Female Teachers"], ["/quran/noorani-qaida", "Noorani Qaida"], ["/quran/nazra", "Nazra"], ["/quran/tajweed", "Tajweed"], ["/quran/hifz", "Hifz"], ["/quran/adults", "Adults"]];

/** Visible country selector (no IP redirects). */
export function RegionSelector({ current }: { current?: Region }) {
  return (
    <div className="flex items-center gap-1.5 text-sm" role="group" aria-label="Choose your country">
      <span className="text-slate-500">Country:</span>
      {(Object.keys(REGIONS) as Region[]).map((r) => (
        <Link key={r} href={`${REGIONS[r].path}#pricing`} hrefLang={REGIONS[r].hreflang} aria-current={current === r ? "page" : undefined}
          className={`rounded-full border px-3 py-1 font-semibold transition ${current === r ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-navy hover:border-emerald-700"}`}>
          {r === "uk" ? "UK (£)" : "USA ($)"}
        </Link>
      ))}
    </div>
  );
}

export default function QuranShell({ children, region }: { children: React.ReactNode; region?: Region }) {
  return (
    <div className="bg-white text-navy">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" />
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-6 text-base font-semibold lg:flex">
            {NAV.map(([h, l]) => <Link key={h} href={h} className="text-navy transition hover:text-emerald-700">{l}</Link>)}
          </nav>
          <Link href="/quran/book-trial" className="rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-800"><span className="hidden sm:inline">Book Free Quran Assessment</span><span className="sm:hidden">Free Assessment</span></Link>
        </div>
        <div className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1.5">
            <nav aria-label="Sections" className="flex gap-4 overflow-x-auto whitespace-nowrap text-sm font-semibold [scrollbar-width:none] lg:hidden">
              {NAV.map(([h, l]) => <Link key={h} href={h} className="py-1 text-navy">{l}</Link>)}
            </nav>
            <div className="shrink-0 lg:ml-auto"><RegionSelector current={region} /></div>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-200 bg-white text-base text-slate-700">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 text-base md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs leading-relaxed text-slate-700">One-to-one online Quran lessons with personal attention, strong Islamic manners and measurable progress.</p>
          </div>
          <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8a6500]">Quran classes</p><ul className="mt-4 space-y-2.5">{CLASSES.map(([h, l]) => <li key={h}><Link href={h} className="hover:text-emerald-700">{l}</Link></li>)}<li><Link href="/quran/uk" className="hover:text-emerald-700">Quran classes UK</Link></li><li><Link href="/quran/usa" className="hover:text-emerald-700">Quran classes USA</Link></li></ul></div>
          <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8a6500]">Information</p><ul className="mt-4 space-y-2.5"><li><Link href="/quran/pricing" className="hover:text-emerald-700">Pricing</Link></li><li><Link href="/quran/book-trial" className="hover:text-emerald-700">Book free assessment</Link></li><li><Link href="/privacy" className="hover:text-emerald-700">Privacy policy</Link></li><li><Link href="/refund-policy" className="hover:text-emerald-700">Refund policy</Link></li><li><Link href="/terms" className="hover:text-emerald-700">Terms</Link></li><li><WhatsAppLink href={`https://wa.me/${WHATSAPP}`} className="hover:text-emerald-700">WhatsApp us</WhatsAppLink></li></ul></div>
        </div>
        <p className="border-t border-slate-200 py-4 text-center text-xs text-slate-700">© Abu Bakkar Academy</p>
      </footer>
    </div>
  );
}
