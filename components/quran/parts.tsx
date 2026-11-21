import Link from "next/link";
import Image from "next/image";
import { Check, ChevronDown, ClipboardCheck, LineChart, ShieldCheck, UserRound, Video, CalendarCheck, ArrowRight, type LucideIcon } from "lucide-react";
import { COMMON_FAQ, REGIONS, SITE, money, visiblePlans, type Region, type SeoPage } from "@/lib/quran";

const AR = { fontFamily: "'Amiri','Scheherazade New','Traditional Arabic','Noto Naskh Arabic',serif" } as const;

export const CTA = ({ children = "Book Your Free Quran Assessment", href = "/quran/book-trial" }: { children?: React.ReactNode; href?: string }) => (
  <Link href={href} className="group inline-flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-4 text-base font-bold text-navy shadow-[0_10px_30px_-8px_rgba(212,160,23,0.7)] transition hover:-translate-y-0.5 hover:brightness-105">{children}<ArrowRight size={18} className="transition group-hover:translate-x-1" /></Link>
);
export const CTA2 = ({ children, href, light = false }: { children: React.ReactNode; href: string; light?: boolean }) => (
  <Link href={href} className={`inline-flex items-center justify-center rounded-full border-2 px-7 py-[14px] text-base font-bold transition ${light ? "border-white/50 text-white hover:bg-white/10" : "border-[#0b5a3e] text-[#0b5a3e] hover:bg-[#0b5a3e] hover:text-white"}`}>{children}</Link>
);

/** Split hero on warm cream: copy on the left, the lesson photo in an arch on the right with floating info cards. */
export function Hero({ h1, sub, region, photo = true }: { h1: string; sub: string; region?: Region; eyebrow?: string; photo?: boolean }) {
  return (
    <section className="relative overflow-hidden bg-[#fbf7ee]">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold/25 blur-3xl" aria-hidden="true" />
      <div className={`relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 md:py-20 ${photo ? "lg:grid-cols-[1.1fr_0.9fr]" : ""}`}>
        <div className={photo ? "" : "mx-auto max-w-3xl text-center"}>
          <p className="text-center text-3xl text-[#8a6500] md:text-4xl lg:text-left" style={AR} dir="rtl" aria-hidden="true">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
          <h1 className="mt-4 font-serif text-[2.2rem] font-bold leading-[1.1] text-navy md:text-6xl">{h1}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-800 md:text-xl">{sub}</p>
          <div className={`mt-8 flex flex-col gap-3 sm:flex-row ${photo ? "" : "justify-center"}`}><CTA /><CTA2 href={region ? "#pricing" : "/quran/pricing"}>View Monthly Plans</CTA2></div>
        </div>
        {photo && (
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute inset-x-6 -bottom-4 top-6 rounded-t-[999px] rounded-b-[2rem] bg-[#0b5a3e]" aria-hidden="true" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2rem] border-[6px] border-white shadow-2xl">
              <Image src="/program-photo.png" alt="A smiling girl wearing headphones waves to her Quran teacher during a live online lesson" fill priority sizes="(min-width:1024px) 480px, 90vw" className="object-cover object-[30%_20%]" />
            </div>
            <div className="absolute -left-3 bottom-16 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-xl ring-1 ring-black/5 md:-left-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b5a3e]"><Video size={22} className="text-white" /></span>
              <div className="leading-tight"><p className="text-sm font-bold text-navy">Live 1-to-1 lesson</p><p className="text-sm text-slate-700">You and your teacher only</p></div>
            </div>
            <div className="absolute -right-2 top-10 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 md:-right-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#8a6500]">Free first step</p>
              <p className="mt-0.5 text-sm font-bold text-navy">20–30 min assessment</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Dark band of four plain facts (no invented numbers). */
export const StatsStrip = () => (
  <section className="bg-navy text-white">
    <ul className="mx-auto grid max-w-6xl grid-cols-2 divide-white/10 px-5 py-8 md:grid-cols-4 md:divide-x">
      {[["1 : 1", "Live lessons, never groups"], ["Free", "First assessment, no card"], ["2 – 5", "Sessions per week, by plan"], ["Monthly", "Written progress report"]].map(([a, b]) => (
        <li key={a} className="px-4 py-3 text-center"><p className="font-serif text-3xl font-bold text-gold md:text-4xl">{a}</p><p className="mt-1 text-base text-white">{b}</p></li>))}
    </ul>
  </section>
);

/** A page band: eyebrow + big serif title. `alt` gives the cream tint. */
export const Section = ({ title, children, id, eyebrow, tone = "plain" }: { title: string; children: React.ReactNode; id?: string; eyebrow?: string; tone?: "plain" | "alt" }) => (
  <section id={id} className={`scroll-mt-28 ${tone === "alt" ? "bg-[#fbf7ee]" : "bg-white"}`}>
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <div className="max-w-3xl">
        {eyebrow && <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8a6500]">{eyebrow}</p>}
        <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-navy md:text-5xl">{title}</h2>
      </div>
      <div className="mt-8 space-y-5 text-lg leading-relaxed text-slate-800 md:text-xl [&>p]:max-w-3xl">{children}</div>
    </div>
  </section>
);

/** Feature list as large cards. */
export const Bullets = ({ items }: { items: string[] }) => (
  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((x) => (
    <li key={x} className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_10px_30px_-12px_rgba(11,31,58,0.18)] ring-1 ring-slate-100">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b5a3e]"><Check size={20} className="text-white" /></span>
      <p className="mt-4 text-xl font-bold leading-snug text-navy">{x}</p>
    </li>))}</ul>
);

export const PROGRAMS: [string, string, string, string][] = [
  ["Noorani Qaida", "/quran/noorani-qaida", "Letters, sounds and first reading for beginners.", "ا ب ت"],
  ["Nazra Quran", "/quran/nazra", "Fluent reading of the Quran with live correction.", "قرآن"],
  ["Tajweed", "/quran/tajweed", "Pronunciation and recitation rules.", "تجويد"],
  ["Hifz", "/quran/hifz", "Memorisation with a revision plan, subject to specialist availability.", "حفظ"],
];
export const ProgramCards = () => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{PROGRAMS.map(([n, h, d, ar], i) => (
    <Link key={h} href={h} className="group relative flex min-h-[18rem] flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-[#0b5a3e] to-[#06432f] p-6 text-white shadow-xl transition hover:-translate-y-1.5">
      <span className="text-sm font-bold text-gold">0{i + 1}</span>
      <div>
        <p className="text-4xl text-gold" style={AR} aria-hidden="true">{ar}</p>
        <h3 className="mt-3 font-serif text-2xl font-bold">{n}</h3>
        <p className="mt-2 text-base leading-relaxed text-white">{d}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-base font-bold text-gold">Learn more <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
      </div>
    </Link>))}</div>
);

export const STEPS: [LucideIcon, string, string][] = [
  [CalendarCheck, "Book a free assessment", "Fill in a short form. No card needed."],
  [Video, "Meet your teacher", "A live 20–30 minute assessment to find your level."],
  [ClipboardCheck, "Get your recommended plan", "Your teacher suggests the level and monthly plan."],
  [ShieldCheck, "Choose a plan and pay securely", "Available once international payment is live."],
  [UserRound, "Teacher and schedule confirmed", "A regular weekly time that suits your time zone."],
  [LineChart, "Monthly progress update", "A clear report so you always know where you stand."],
];
export const HowItWorks = () => (
  <ol className="relative grid gap-x-10 gap-y-2 md:grid-cols-2">{STEPS.map(([Icon, s], i) => (
    <li key={s} className="relative flex gap-5 py-5">
      <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0b5a3e] text-white shadow-lg"><Icon size={26} /><span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-extrabold text-navy">{i + 1}</span></span>
      <h3 className="self-center font-serif text-xl font-bold text-navy">{s}</h3>
    </li>))}</ol>
);

/** Example of the monthly report. Clearly labelled as a sample. */
export function ReportPreview() {
  const rows: [string, string][] = [["Level", "Nazra"], ["Lessons attended", "11 of 12"], ["Progress", "Surah An-Naba, ayah 1–20"], ["Practise next", "Ghunnah on noon sakinah"]];
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-gold/40" aria-hidden="true" />
      <div className="relative rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-100">
        <div className="flex items-center justify-between"><p className="font-serif text-lg font-bold text-navy">Monthly progress report</p><span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#8a6500]">Sample</span></div>
        <dl className="mt-5 divide-y divide-slate-100">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-3 text-sm"><dt className="text-slate-700">{k}</dt><dd className="text-right font-semibold text-navy">{v}</dd></div>)}</dl>
        <div className="mt-3 rounded-2xl bg-[#fbf7ee] p-4 text-base italic text-slate-800">&ldquo;Reads with growing confidence. Needs a little more practice on stretching the madd letters.&rdquo;<span className="mt-1 block not-italic font-semibold text-navy">Teacher feedback</span></div>
      </div>
    </div>
  );
}

/** Report section: copy + sample card. */
export const ReportSection = () => (
  <section className="bg-white">
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 md:py-20 lg:grid-cols-2">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8a6500]">Know where your child stands</p>
        <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-navy md:text-5xl">A clear report every month</h2>
        <p className="mt-6 text-lg leading-relaxed text-slate-800 md:text-xl">No guessing. Each month you receive a simple report with your child&apos;s level, lessons attended, reading or memorisation progress, areas to practise and the teacher&apos;s feedback.</p>
      </div>
      <ReportPreview />
    </div>
  </section>
);

const NOTES = ["Billed monthly. Full amount and currency shown before you pay", "Free assessment, no registration fee", "10% off each extra sibling", "Weekly sessions, billed monthly", "Launch prices, subject to approval"];

/** Prices for one region. Hifz is hidden until HIFZ_LIVE. */
export function PricingTable({ region }: { region: Region }) {
  const r = REGIONS[region];
  return (
    <div>
      <div className="grid items-stretch gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePlans().map((p) => (
          <div key={p.key} className={`relative flex flex-col overflow-hidden rounded-3xl p-7 ${p.recommended ? "bg-gradient-to-b from-[#0b5a3e] to-[#06432f] text-white shadow-2xl lg:-translate-y-3" : "bg-white text-navy shadow-[0_10px_30px_-12px_rgba(11,31,58,0.2)] ring-1 ring-slate-200"}`}>
            {p.recommended && <span className="absolute right-5 top-5 rounded-full bg-gold px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-navy">Recommended</span>}
            <h3 className="font-serif text-2xl font-bold">{p.name}</h3>
            <p className="mt-4 flex items-end gap-1"><span className="font-serif text-5xl font-bold">{money(region, p.price[region])}</span><span className={`pb-2 text-sm ${p.recommended ? "text-white" : "text-slate-700"}`}>/ month · {r.currency}</span></p>
            <ul className={`mt-6 space-y-3 border-t pt-6 text-base ${p.recommended ? "border-white/20" : "border-slate-100"}`}>
              {[`${p.sessions} one-to-one sessions per week`, `${p.minutes} minutes per session`, "Monthly progress report", "Free assessment first"].map((t) => <li key={t} className="flex gap-3"><Check size={18} className={`mt-1 shrink-0 ${p.recommended ? "text-gold" : "text-[#0b5a3e]"}`} />{t}</li>)}
            </ul>
            <Link href={`/quran/book-trial?region=${region}&plan=${p.key}`} className={`mt-8 inline-flex justify-center rounded-full px-5 py-3.5 text-center font-bold transition ${p.recommended ? "bg-gold text-navy hover:brightness-105" : "bg-navy text-white hover:bg-[#12305a]"}`}>Start with a free assessment</Link>
          </div>
        ))}
      </div>
      <div className="marquee mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white py-3 text-navy" aria-label="Billed monthly. Full amount and currency shown before you pay. Free assessment, no registration fee, 10% off each extra sibling. Weekly sessions, billed monthly. Launch prices, subject to approval.">
        <div className="marquee-track flex w-max" style={{ animationDuration: "90s" }} aria-hidden="true">
          {[0, 1].map((half) => (
            <ul key={half} className="flex shrink-0">
              {[...NOTES, ...NOTES].map((t, i) => (
                <li key={i} className="flex items-center gap-2 whitespace-nowrap px-6 text-base font-semibold md:text-lg"><Check size={20} className="shrink-0 text-[#0b5a3e]" />{t}</li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}

/** FAQ accordion. All answers are in the HTML; the first one starts open. */
export function Faq({ items = COMMON_FAQ }: { items?: [string, string][] }) {
  return (
    <div className="space-y-3">{items.map(([q, a], i) => (
      <details key={q} open={i === 0} className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 open:shadow-lg open:ring-[#0b5a3e]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-base font-bold text-navy md:text-lg [&::-webkit-details-marker]:hidden">{q}<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0b5a3e]/10 transition group-open:rotate-180 group-open:bg-[#0b5a3e]"><ChevronDown size={18} className="text-[#0b5a3e] group-open:text-white" /></span></summary>
        <p className="px-5 pb-5 text-lg leading-relaxed text-slate-800">{a}</p>
      </details>))}</div>
  );
}

export const FinalCta = () => (
  <section className="relative overflow-hidden bg-[#0b5a3e] py-20 text-center text-white">
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[22rem] leading-none text-white/[0.04]" style={AR} aria-hidden="true">﷽</div>
    <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-gold/20 blur-3xl" aria-hidden="true" />
    <div className="relative mx-auto max-w-2xl px-5">
      <h2 className="font-serif text-3xl font-bold leading-tight md:text-5xl">Begin with a free Quran assessment</h2>
      <div className="mt-9"><CTA /></div>
    </div>
  </section>
);

/** JSON-LD. Only describes content visible on the page. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
export const orgLd = { "@context": "https://schema.org", "@type": "EducationalOrganization", name: "Abu Bakkar Academy", url: SITE, logo: `${SITE}/logo.png` };
export const crumbLd = (items: [string, string][]) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE}${path}` })),
});
export const Schema = ({ page, name }: { page: SeoPage; name?: string }) => (
  <><JsonLd data={orgLd} /><JsonLd data={crumbLd(page.path === "/quran" ? [["Home", "/"], ["Online Quran Classes", "/quran"]] : [["Home", "/"], ["Online Quran Classes", "/quran"], [name ?? page.h1, page.path]])} /></>
);

/** Next metadata: unique title/description, self-canonical, optional hreflang among genuine regional equivalents. */
export function meta(p: SeoPage, languages?: Record<string, string>) {
  return {
    title: { absolute: p.title }, description: p.description,
    alternates: { canonical: p.path, ...(languages ? { languages } : {}) },
    openGraph: { title: p.title, description: p.description, url: p.path, type: "website" as const },
  };
}
