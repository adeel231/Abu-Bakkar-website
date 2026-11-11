import Footer from "@/components/Footer";
import Tracker, { EnrollLink } from "@/components/Tracker";
import { HandHeart, HeartHandshake, ShieldCheck, Hourglass, Landmark, Star, CalendarCheck, MessagesSquare, GraduationCap, TrendingUp, Sprout, Video, ClipboardList, type LucideIcon } from "lucide-react";
import ParentPromise from "@/components/ParentPromise";
import HeroBand from "@/components/HeroBand";
import ShareButton from "@/components/ShareButton";
import QuizSection from "@/components/QuizSection";
import { AgeGroups, CharacterPackages } from "@/components/Packages";
import { AnnouncementBar, FloatingBar, Header } from "@/components/Chrome";
import { anyLimited, getCatalog, getPromiseCount, getSettings } from "@/lib/db";
import { formatPKR, monthlyPackage } from "@/lib/pricing";
import { buildFaq } from "@/lib/faq";
import { WHATSAPP } from "@/lib/contact";

export const dynamic = "force-dynamic";

const QUALITIES: [LucideIcon, string, string][] = [
  [HeartHandshake, "Respect for Parents", "Walidain ki izzat ita’at aur shukr guzaari sikhaate hain."],
  [ShieldCheck, "Honesty", "Sach bolne aur imandaari se jeene ki adat daalte hain."],
  [Hourglass, "Patience", "Sabr bardasht aur mushkilat mein itminaan sikhaate hain."],
  [HandHeart, "Kindness", "Dusron ke liye mohabbat reham aur madad ka jazba paida karte hain."],
  [Landmark, "Islamic Values", "Qur’an aur Sunnah ki roshni mein zindagi ke bunyadi usool sikhaate hain."],
  [Star, "Confidence", "Positive soch khud par aitmaad aur behtar andaaz-e-bayaan paida karte hain."],
  [CalendarCheck, "Discipline", "Waqt ki qadr zimmedaari aur behtareen aadaton ki tarbiyat karte hain."],
  [MessagesSquare, "Communication Skills", "Adab ke saath baat karna aur apni baat wazeh taur par rakhna sikhaate hain."],
  [GraduationCap, "Academic Excellence", "Behtar learning habits focus aur mehnat se nathayaj hasil karne ki rahnumai karte hain."],
];

const JOURNEY = [
  ["Choose Your Service", "Character Grooming or Academic Tuition."],
  ["Pick Class Type and Package", "Group or Private, paid monthly or in advance."],
  ["Enter Details", "Age group or school grade, parent and student details."],
  ["Pay", "JazzCash, Easypaisa or bank transfer."],
  ["We Verify Your Payment", "Your seat is confirmed only after we check it."],
  ["Get Your Enrollment ID", "Joining instructions arrive on WhatsApp."],
];

export default async function Home() {
  const [c, settings, promiseCount] = await Promise.all([getCatalog(), getSettings(), getPromiseCount()]);
  const hook = (settings.hero_hook || "Abu Bakkar Ne Sab Ka Dil Kyun Jeeta?").replace(/!/g, "").replace(/Abu Bakar(?!k)/g, "Abu Bakkar");
  const sub = (settings.hero_sub || "Sirf Uski Taleem Ki Wajah Se Nahi!\nUske Kirdar Aur Akhlaq Ki Wajah Se").split("\n").map((x) => x.trim()).filter(Boolean);
  const promise = settings.promise_text || "I promise to focus on my child's character as much as their education.";

  const cg = c.programs.find((p) => p.kind === "character");
  const mainPrice = cg ? monthlyPackage(c.packages, cg.id, "group")?.price_pkr : undefined;
  const price = formatPKR(mainPrice ?? 6000);
  const limited = c.fromDb && anyLimited(c);
  const enrollHref = "/enroll";
  const faq = buildFaq(c);

  return (
    <main>
      <Tracker event="landing_view" meta={["ViewContent", { content_name: "landing" }]} />
      {/* Strip + menu stick together, so the menu always sits right under the strip however tall it gets */}
      <div className="sticky top-0 z-50">
        <AnnouncementBar />
        <Header href={enrollHref} />
      </div>

      {/* 1. HERO — the designed banner (boy imagining the young man he admires) */}
      <HeroBand
        as="h1" concept id="hero" image="/hero-boy-full.jpg"
        share={<ShareButton id="hero" tone="dark" corner="bottom-right" title="Abu Bakkar Academy" text="Sirf Taleem Nahi Tarbiyat Bhi. Live online Character Grooming for boys and girls aged 5 to 15." />}
        alt="A boy at his desk imagines himself as the young man he admires, reading a book"
        hook={hook} sub={sub} badge={limited ? "Limited Seats Available" : undefined}
        pill={<><Sprout size={16} /> Sirf Taleem Nahi, Tarbiyat Bhi <Sprout size={16} className="-scale-x-100" /></>}
        paragraph="We help children develop the same positive qualities that parents admire."
        primary={{ href: enrollHref, label: "ENROLL NOW" }} secondary={{ href: "#programs", label: "View Online Program" }}
      />

      {/* 2. CHARACTER DEVELOPMENT (qualities) */}
      <section id="qualities" className="relative bg-white text-[#0a3d2c]">
        <ShareButton id="qualities" corner="top-right" title="Character Development at Abu Bakkar Academy" text="Respect and honesty and patience and kindness. See the qualities every parent wants to see in their child." />
        <div className="section text-center">
          <h2 className="h2">Character Development</h2>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {QUALITIES.map(([Icon, name, how]) => (
              <div key={name} className="flex flex-col items-center last:col-span-2 md:last:col-span-1 rounded-3xl border border-[#e3d8bc] bg-[#fbf7ec] px-3 py-6 text-center shadow-[0_2px_10px_rgba(80,60,10,0.08)] md:px-6 md:py-8">
                <Icon size={44} strokeWidth={1.75} className="text-[#0b5a3e]" />
                <h3 className="mt-3 font-serif text-lg font-bold leading-tight text-[#0b5a3e] md:text-2xl">{name}</h3>
                <p className="mt-2 text-sm leading-snug text-[#2f3b35] md:text-base">{how}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. MAIN PROGRAM BANNER — Character Grooming (scales like the design image on large screens) */}
      <section id="programs" className="relative isolate overflow-hidden bg-gradient-to-br from-[#0b4d37] to-[#052a1f] text-white lg:aspect-[1571/768]">
        <div role="img" aria-label="A smiling girl waving during a live online class"
          className="prog-photo h-72 w-full bg-cover bg-[position:50%_14%] sm:h-96 lg:absolute lg:inset-y-0 lg:left-0 lg:-z-10 lg:h-auto lg:w-[42.8%] lg:bg-[position:left_center]"
          style={{ backgroundImage: "url(/program-photo.png)" }} />
        <ShareButton id="programs" tone="dark" corner="top-right" title="Character Grooming Program" text="Live online Character Grooming for boys and girls aged 5 to 15 at Abu Bakkar Academy." />

        <div className="mx-auto flex max-w-6xl flex-col justify-center px-5 py-16 md:py-20 lg:mx-0 lg:h-full lg:max-w-none lg:py-0 lg:pl-[43.6vw] lg:pr-[3vw]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold lg:text-[0.9vw]">Our Main Program</p>
          <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-gold px-5 py-2 font-bold text-navy lg:mt-[0.9vw] lg:gap-[0.6vw] lg:px-[1.5vw] lg:py-[0.55vw] lg:text-[1.4vw]">
            <Video className="h-5 w-5 lg:h-[1.5vw] lg:w-[1.5vw]" /> Live Online Classes
          </span>
          <h2 className="mt-4 font-serif text-4xl font-bold leading-[1.05] md:text-6xl lg:mt-[0.8vw] lg:text-[4.1vw]">Character Grooming Program</h2>

          <div className="mt-6 flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-8 lg:mt-[1.6vw] lg:gap-[1.9vw]">
            <div className="w-full max-w-md divide-y divide-[#e3d8bc] rounded-2xl bg-[#fbf7ec] px-5 py-1 text-[#14241c] shadow-lg lg:w-[31vw] lg:max-w-none lg:rounded-[1vw] lg:px-[1.6vw] lg:py-[0.4vw]">
              {([[Video, "Live Online Classes"], [Sprout, "Character Grooming"], [Landmark, "Islamic Manners"], [TrendingUp, "Personality Development"], [Star, "Confidence Building"], [ClipboardList, "Practical Activities"]] as [LucideIcon, string][]).map(([Icon, t]) => (
                <p key={t} className="flex items-center gap-3 py-2.5 font-medium lg:gap-[1vw] lg:py-[0.62vw] lg:text-[1.4vw]"><Icon className="h-5 w-5 shrink-0 text-[#0b5a3e] lg:h-[1.7vw] lg:w-[1.7vw]" />{t}</p>
              ))}
            </div>
            {/* Monthly price seal */}
            <div className="flex h-40 w-40 shrink-0 flex-col items-center justify-center rounded-full border-[3px] border-white/80 bg-gold text-center text-navy shadow-xl lg:h-[14.4vw] lg:w-[14.4vw]">
              <span className="text-sm font-semibold leading-tight lg:text-[1.4vw]">Online Group<br />Classes</span>
              <span className="mt-1 whitespace-nowrap font-sans text-2xl font-extrabold lg:mt-[0.5vw] lg:text-[2.4vw]">{price}</span>
              <span className="text-sm font-semibold lg:text-[1.2vw]">per month</span>
            </div>
          </div>

          <EnrollLink href="#packages" className="btn-gold mt-8 w-fit !px-7 !py-3 text-base lg:mt-[2vw] lg:!px-[2.2vw] lg:!py-[0.9vw] lg:text-[1.15vw]">Choose Your Package</EnrollLink>
        </div>
      </section>

      {/* 4. PACKAGES + AGE GROUPS (primary service) */}
      <CharacterPackages c={c} wa={WHATSAPP} />

      {/* Interactive game */}
      <QuizSection price={price} schedule={cg ? monthlyPackage(c.packages, cg.id, "group")?.schedule_note ?? "" : ""} />

      <AgeGroups c={c} />

      {/* TEACHERS */}
      <section id="teachers" className="relative isolate overflow-hidden bg-white text-navy">
        <ShareButton id="teachers" corner="top-right" title="Qualified Verified Teachers" text="Classes at Abu Bakkar Academy are taught by qualified teachers for each age group." />
        {/* Same layout as the program banner, mirrored: the photo sits on the RIGHT and fades into the white on its inner edge. */}
        <div aria-hidden className="prog-photo prog-photo-right h-72 w-full bg-cover bg-no-repeat bg-[position:62%_22%] sm:h-96 lg:absolute lg:inset-y-0 lg:right-0 lg:-z-10 lg:h-auto lg:w-[46%] lg:bg-[position:62%_20%]"
          style={{ backgroundImage: "url(/hero-man.webp)" }} />

        <div className="mx-auto flex max-w-6xl flex-col justify-center px-5 py-14 md:py-16 lg:mx-0 lg:min-h-[32rem] lg:max-w-none lg:pl-[8vw] lg:pr-[48%]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">Our Teachers</p>
          <h2 className="mt-3 font-serif text-4xl font-bold leading-[1.05] md:text-5xl">Taught by Qualified, Verified Teachers</h2>

          <div className="mt-8 w-full max-w-md divide-y divide-[#e3d8bc] rounded-2xl border border-[#e3d8bc] bg-[#fbf7ec] px-5 py-1 text-[#14241c] shadow-[0_2px_10px_rgba(80,60,10,0.08)]">
            {([[GraduationCap, "Qualified", "Classes are taught by qualified teachers for each age group."], [ShieldCheck, "Child-safe", "Live classes with parent-approved joining links."], [TrendingUp, "Parent feedback", "Regular guidance and updates so you see your child’s growth."]] as [LucideIcon, string, string][]).map(([Icon, t, d]) => (
              <div key={t} className="flex items-start gap-3 py-3.5">
                <Icon className="mt-0.5 h-6 w-6 shrink-0 text-[#0b5a3e]" />
                <div><p className="font-bold">{t}</p><p className="mt-0.5 text-sm text-[#2f3b35]">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE BAND */}
      <section id="hadith" className="relative bg-[#052a1f] text-center text-white">
        <ShareButton id="hadith" tone="dark" corner="top-right" title="Hadith" text="“Tum mein sab se behtar woh hai jis ke akhlaaq sab se achhe hon.” (Sahih al-Bukhari)" />
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <p className="font-serif text-2xl font-bold leading-snug md:text-3xl">“Tum mein sab se behtar woh hai jis ke akhlaaq sab se achhe hon.”</p>
          <p className="mt-3 font-semibold text-gold">— Hadith, Sahih al-Bukhari</p>
          <EnrollLink href={enrollHref} className="btn-gold mt-8">Begin Your Child’s Journey</EnrollLink>
        </div>
      </section>

      {/* PARENT PROMISE + live counter */}
      <ParentPromise text={promise} count={promiseCount} />

      {/* HOW IT WORKS */}
      <section id="journey" className="relative bg-slate-50 text-navy">
        <ShareButton id="journey" corner="top-right" title="How to enroll at Abu Bakkar Academy" text="Enrolling your child takes six simple steps. See how it works." />
        <div className="section">
          <h2 className="h2 text-center">Your Journey With Us</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {JOURNEY.map(([t, d], i) => (
              <li key={t} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-serif text-3xl font-extrabold text-gold">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-1 font-bold text-navy">{t}</p><p className="text-sm text-slate-600">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative bg-slate-50 text-navy">
        <ShareButton id="faq" corner="top-right" title="Parent FAQs" text="Answers to common parent questions about Abu Bakkar Academy." />
        <div className="section !pt-0">
        <h2 className="h2 text-center">Parent FAQs</h2>
        <div className="mx-auto mt-8 max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {faq.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold text-navy">{q}</summary>
              <p className="mt-2 text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </div></section>

      {/* FINAL CTA */}
      <section id="join" className="relative overflow-hidden border-t border-gold/40 bg-gradient-to-br from-[#0a4a36] to-[#052a1f] text-center text-white">
        <ShareButton id="join" tone="dark" corner="top-right" title="Abu Bakkar Academy" text="Your child's best chapter can begin today. Sirf Taleem Nahi Tarbiyat Bhi." />
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <h2 className="font-serif text-3xl font-bold md:text-5xl">Your Child’s Best Chapter Can Begin Today</h2>
          <p className="mt-3 text-white/85">Sirf Taleem Nahi, Tarbiyat Bhi.</p>
          <EnrollLink href={enrollHref} className="btn-gold mt-8 !px-10 !py-4 text-lg">ENROLL NOW</EnrollLink>
        </div>
      </section>

      <Footer />
      <FloatingBar href={enrollHref} />
      <div className="h-16 md:hidden" />
    </main>
  );
}
