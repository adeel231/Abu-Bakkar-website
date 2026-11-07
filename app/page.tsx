import Footer from "@/components/Footer";
import Tracker, { EnrollLink } from "@/components/Tracker";
import { HandHeart, HeartHandshake, ShieldCheck, Hourglass, Landmark, Star, CalendarCheck, MessagesSquare, GraduationCap, Check, TrendingUp, Sprout, Video, ClipboardList, type LucideIcon } from "lucide-react";
import ParentPromise from "@/components/ParentPromise";
import { AnnouncementBar, FloatingBar, Header } from "@/components/Chrome";
import { getPrograms, getSettings, pkr, seatsLeft, type Program } from "@/lib/db";

export const dynamic = "force-dynamic";

const QUALITIES: [LucideIcon, string, string][] = [
  [HeartHandshake, "Respect for Parents", "Walidain ki izzat, ita’at aur shukr guzaari sikhaate hain."],
  [ShieldCheck, "Honesty", "Sach bolne aur imandaari se jeene ki adat daalte hain."],
  [Hourglass, "Patience", "Sabr, bardasht aur mushkilat mein itminaan sikhaate hain."],
  [HandHeart, "Kindness", "Dusron ke liye mohabbat, reham aur madad ka jazba paida karte hain."],
  [Landmark, "Islamic Values", "Qur’an aur Sunnah ki roshni mein zindagi ke bunyadi usool sikhaate hain."],
  [Star, "Confidence", "Positive soch, khud par aitmaad aur behtar andaaz-e-bayaan paida karte hain."],
  [CalendarCheck, "Discipline", "Waqt ki qadr, zimmedaari aur behtareen aadaton ki tarbiyat karte hain."],
  [MessagesSquare, "Communication Skills", "Adab ke saath baat karna, apni baat wazeh taur par rakhna sikhaate hain."],
  [GraduationCap, "Academic Excellence", "Behtar learning habits, focus aur mehnat se nathayaj hasil karne ki rahnumai karte hain."],
];

const FAQ = [
  ["How do online classes work?", "Classes are live, small-group sessions on Zoom/Google Meet. After payment is verified we send the joining link and schedule on WhatsApp."],
  ["Who are the teachers?", "Teacher names and qualifications are published on the batch page once confirmed. We only open enrollment after a qualified teacher is confirmed."],
  ["Which age groups can join?", "The founding Character Grooming batch is designed for the age group shown on the program card. Academic tuition is grade-based."],
  ["What are the schedules?", "Class timings are listed with each batch. You can tell us your preferred schedule in the enrollment form and we will do our best to match it."],
  ["How big are the classes?", "We cap each batch at the number of seats shown on the program card so every child gets attention."],
  ["Is there homework?", "Yes — short practical assignments (e.g. daily habits and conversations at home), designed to involve the family, not to burden the child."],
  ["What are the fees and how do I pay?", "The fee is shown on each program. Pay in advance by JazzCash, Easypaisa or bank transfer; your seat is confirmed once we verify the payment."],
  ["What is the refund policy?", "If a batch cannot launch you get a full refund. Other cancellations follow our Refund & Cancellation Policy."],
  ["How will I know my child’s progress?", "You receive parent guidance and feedback during and at the end of the program."],
];

function Card({ p }: { p: Program }) {
  const open = p.status === "open" && p.price_pkr > 0 && seatsLeft(p) > 0;
  return (
    <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-navy">{p.name}</h3>
      <p className="mt-2 text-slate-600">{p.description}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-slate-500">Age / Grade</dt><dd className="font-semibold">{p.age_group || "TBC"}</dd></div>
        <div><dt className="text-slate-500">Duration</dt><dd className="font-semibold">{p.duration_weeks} weeks</dd></div>
        {p.sessions > 0 && <div><dt className="text-slate-500">Live sessions</dt><dd className="font-semibold">{p.sessions}</dd></div>}
        <div><dt className="text-slate-500">Timings</dt><dd className="font-semibold">{p.timings || "TBC"}</dd></div>
        <div><dt className="text-slate-500">Teacher</dt><dd className="font-semibold">{p.teacher || "TBC"}</dd></div>
        <div><dt className="text-slate-500">Starts</dt><dd className="font-semibold">{p.start_date ? new Date(p.start_date).toDateString() : "To be confirmed"}</dd></div>
        <div><dt className="text-slate-500">Fee</dt><dd className="font-semibold text-emerald-700">{p.price_pkr > 0 ? pkr(p.price_pkr) : "To be announced"}</dd></div>
        <div><dt className="text-slate-500">Seats left</dt><dd className="font-semibold">{p.status === "open" ? seatsLeft(p) : "—"}</dd></div>
      </dl>
      <div className="mt-auto pt-6">
        {open ? (
          <EnrollLink href={`/enroll?program=${p.slug}`} className="btn-gold w-full">Secure Your Child’s Seat</EnrollLink>
        ) : (
          <span className="btn w-full cursor-not-allowed bg-slate-100 text-slate-500">
            {p.status === "open" ? "Batch full" : "Enrollment opens soon"}
          </span>
        )}
      </div>
    </div>
  );
}

export default async function Home() {
  const [programs, settings] = await Promise.all([getPrograms(), getSettings()]);
  const hook = (settings.hero_hook || "Abu Bakkar Ne Sab Ka Dil Kyun Jeeta?").replace(/!/g, "").replace(/Abu Bakar(?!k)/g, "Abu Bakkar");
  const sub = (settings.hero_sub || "Sirf Uski Taleem Ki Wajah Se Nahi\nUske Khoobsurat Akhlaaq Ki Wajah Se").replace(/!/g, "").split("\n");
  const promise = settings.promise_text || "I promise to focus on my child's character as much as their education.";
  const featured = programs.find((p) => p.slug === "character-grooming");
  const fee = featured && featured.price_pkr > 0 ? featured.price_pkr : 4999;
  const target = programs.find((p) => p.status === "open" && p.price_pkr > 0 && seatsLeft(p) > 0);
  const enrollHref = target ? `/enroll?program=${target.slug}` : "/enroll";

  return (
    <main>
      <Tracker event="landing_view" meta={["ViewContent", { content_name: "landing" }]} />
      <AnnouncementBar href={enrollHref} />
      <Header href={enrollHref} />

      {/* 1. HERO — on large screens it scales like the banner image (same proportions, text hugging the left edge) */}
      <section className="relative isolate overflow-hidden bg-[#052a1f] text-white lg:aspect-[1571/768]">
        <div role="img" aria-label="A thoughtful boy studying at a laptop in a bright room"
          className="hero-photo order-last h-72 w-full bg-cover bg-[position:60%_20%] md:absolute md:inset-y-0 md:right-0 md:-z-10 md:h-auto md:w-[50%] md:bg-[position:right_center] lg:w-[61.8%]"
          style={{ backgroundImage: "url(/hero-photo.png)" }} />

        <div className="mx-auto flex max-w-6xl flex-col justify-center px-5 py-16 md:py-20 lg:mx-0 lg:h-full lg:max-w-none lg:px-[1.6vw] lg:py-0">
          <div className="max-w-xl md:max-w-[48%] lg:max-w-none lg:w-[40%]">
            <h1 className="font-serif text-4xl font-bold leading-[1.1] md:text-5xl lg:text-[3.7vw]">
              {hook.split(" ").slice(0, -1).join(" ")} <span className="text-gold">{hook.split(" ").slice(-1)}</span>
            </h1>
            <div className="mt-6 flex flex-col items-start gap-2 text-sm font-semibold text-navy md:text-base lg:mt-[1.6vw] lg:gap-[0.5vw] lg:text-[1.1vw]">
              {sub.map((l, i) => (
                <p key={i} className={`rounded-sm px-4 py-2 shadow-lg lg:px-[1vw] lg:py-[0.55vw] ${i === 0 ? "bg-white" : "bg-gold"}`}>{l}</p>
              ))}
            </div>

            <p className="mt-8 font-serif text-3xl font-bold md:text-4xl lg:mt-[2.4vw] lg:text-[2.3vw]">Abu Bakkar Academy</p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold bg-gold/15 px-5 py-1.5 font-serif text-base font-semibold text-gold md:text-lg lg:mt-[0.9vw] lg:px-[1.5vw] lg:py-[0.45vw] lg:text-[1.3vw]">
              <Sprout size={16} /> Sirf Taleem Nahi, Tarbiyat Bhi <Sprout size={16} className="-scale-x-100" />
            </p>
            <p className="mt-5 max-w-md text-base text-white/90 md:text-lg lg:mt-[1.4vw] lg:max-w-none lg:w-[92%] lg:text-[1.2vw] lg:leading-relaxed">
              We help children develop the same positive qualities that parents admire.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row md:flex-col md:items-start lg:mt-[2vw] lg:flex-row lg:items-center lg:gap-[1vw]">
              <EnrollLink href={enrollHref} className="btn-gold whitespace-nowrap !px-10 !py-4 text-base lg:!px-[2.6vw] lg:!py-[1.2vw] lg:text-[1.1vw]">ENROLL NOW</EnrollLink>
              <a href="#programs" className="btn-outline whitespace-nowrap !px-8 !py-4 text-base lg:!px-[2vw] lg:!py-[1.2vw] lg:text-[1.1vw]">View Online Program</a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY */}
      <section id="why" className="bg-white text-navy"><div className="section">
        <h2 className="h2 text-center">Why Abu Bakkar Academy?</h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["Character grooming", "Islamic manners and values", "Academic tuition", "Confidence building", "Communication skills", "Emotional intelligence"].map((t) => (
            <li key={t} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 font-medium text-navy shadow-sm">
              <Check size={18} className="shrink-0 text-gold" />{t}
            </li>
          ))}
        </ul>
      </div></section>

      {/* 3. QUALITIES */}
      <section id="qualities" className="bg-white text-[#0a3d2c]">
        <div className="section !pt-0 text-center">
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

      {/* 4 + 6. PROGRAMS / FOUNDING BATCH — scales like the banner image on large screens */}
      <section id="programs" className="relative isolate overflow-hidden bg-gradient-to-br from-[#0b4d37] to-[#052a1f] text-white lg:aspect-[1571/768]">
        <div role="img" aria-label="A smiling girl waving during a live online class"
          className="prog-photo h-72 w-full bg-cover bg-[position:50%_14%] sm:h-96 lg:absolute lg:inset-y-0 lg:left-0 lg:-z-10 lg:h-auto lg:w-[42.8%] lg:bg-[position:left_center]"
          style={{ backgroundImage: "url(/program-photo.png)" }} />

        <div className="mx-auto flex max-w-6xl flex-col justify-center px-5 py-16 md:py-20 lg:mx-0 lg:h-full lg:max-w-none lg:py-0 lg:pl-[43.6vw] lg:pr-[3vw]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold lg:text-[0.9vw]">Our Online Programs</p>
          <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-gold px-5 py-2 font-bold text-navy lg:mt-[0.9vw] lg:gap-[0.6vw] lg:px-[1.5vw] lg:py-[0.55vw] lg:text-[1.4vw]">
            <Video className="h-5 w-5 lg:h-[1.5vw] lg:w-[1.5vw]" /> 4-Week Online
          </span>
          <h2 className="mt-4 font-serif text-4xl font-bold leading-[1.05] md:text-6xl lg:mt-[0.8vw] lg:text-[4.1vw]">Character Grooming Program</h2>

          <div className="mt-6 flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-8 lg:mt-[1.6vw] lg:gap-[1.9vw]">
            <div className="w-full max-w-md divide-y divide-[#e3d8bc] rounded-2xl bg-[#fbf7ec] px-5 py-1 text-[#14241c] shadow-lg lg:w-[31vw] lg:max-w-none lg:rounded-[1vw] lg:px-[1.6vw] lg:py-[0.4vw]">
              {([[Video, "8 Live Online Sessions"], [Sprout, "Character Grooming"], [Landmark, "Islamic Manners"], [TrendingUp, "Personality Development"], [Star, "Confidence Building"], [ClipboardList, "Practical Activities"]] as [LucideIcon, string][]).map(([Icon, t]) => (
                <p key={t} className="flex items-center gap-3 py-2.5 font-medium lg:gap-[1vw] lg:py-[0.62vw] lg:text-[1.4vw]"><Icon className="h-5 w-5 shrink-0 text-[#0b5a3e] lg:h-[1.7vw] lg:w-[1.7vw]" />{t}</p>
              ))}
            </div>
            {/* Fee seal */}
            <div className="flex h-40 w-40 shrink-0 flex-col items-center justify-center rounded-full border-[3px] border-white/80 bg-gold text-center text-navy shadow-xl lg:h-[14.4vw] lg:w-[14.4vw]">
              <span className="text-sm font-semibold leading-tight lg:text-[1.4vw]">Founding<br />Batch Fee</span>
              <span className="mt-1 whitespace-nowrap font-sans text-2xl font-extrabold lg:mt-[0.5vw] lg:text-[2.4vw]">Rs. {fee.toLocaleString("en-PK")}</span>
            </div>
          </div>

          <EnrollLink href={enrollHref} className="btn-gold mt-8 w-fit !px-7 !py-3 text-base lg:mt-[2vw] lg:!px-[2.2vw] lg:!py-[0.9vw] lg:text-[1.15vw]">Secure Your Child’s Seat</EnrollLink>
        </div>
      </section>

      {/* AVAILABLE PROGRAMS / BATCHES */}
      <section className="bg-white text-navy"><div className="section">
        <h2 className="h2">Available Programs &amp; Batches</h2>
        <p className="mt-4 text-slate-600">All classes are live and online. Seats reflect real teaching capacity.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {programs.length ? programs.map((p) => <Card key={p.id} p={p} />) : (
            <p className="text-slate-500">Programs will appear here once the database is connected.</p>
          )}
        </div>
        <ul className="mt-6 list-disc pl-6 text-slate-600">
          <li>Academic Tuition opens once teacher availability, pricing and schedules are confirmed.</li>
        </ul>
      </div></section>

      {/* TEACHERS */}
      <section className="bg-slate-50 text-navy">
        <div className="section">
          <h2 className="h2 text-center">Taught by Qualified, Verified Teachers</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {([[GraduationCap, "Qualified", "We only open a batch after a qualified teacher is confirmed."], [ShieldCheck, "Child-safe", "Live group classes with parent-approved joining links."], [TrendingUp, "Parent feedback", "Regular guidance and updates so you see your child’s growth."]] as [LucideIcon, string, string][]).map(([Icon, t, d]) => (
              <div key={t} className="rounded-2xl bg-white p-6 shadow-sm"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Icon size={24} /></span><p className="mt-2 font-bold text-navy">{t}</p><p className="mt-1 text-sm text-slate-600">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE BAND */}
      <section className="bg-[#052a1f] text-center text-white">
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <p className="font-serif text-2xl font-bold leading-snug md:text-3xl">“Tum mein sab se behtar woh hai jis ke akhlaaq sab se achhe hon.”</p>
          <p className="mt-3 font-semibold text-gold-700">— Hadith, Sahih al-Bukhari</p>
          <EnrollLink href={enrollHref} className="btn-gold mt-8">Begin Your Child’s Journey</EnrollLink>
        </div>
      </section>

      {/* PARENT PROMISE */}
      <ParentPromise text={promise} />

      {/* 5. JOURNEY */}
      <section id="journey" className="bg-slate-50 text-navy">
        <div className="section">
          <h2 className="h2 text-center">Your Journey With Us</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[["Select Program", "Choose the program that fits your child."], ["Parent Details", "Your name, WhatsApp and city."], ["Student Details", "Child’s first name, age and grade."], ["Class Timing", "Tell us your preferred schedule."], ["Pay Online", "JazzCash, Easypaisa or bank transfer."], ["Get Confirmed", "Receive your Enrollment ID and joining instructions."]].map(([t, d], i) => (
              <li key={t} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-serif text-3xl font-extrabold text-gold">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-1 font-bold text-navy">{t}</p><p className="text-sm text-slate-600">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="bg-slate-50 text-navy"><div className="section !pt-0">
        <h2 className="h2 text-center">Parent FAQs</h2>
        <div className="mx-auto mt-8 max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold text-navy">{q}</summary>
              <p className="mt-2 text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </div></section>

      {/* FINAL CTA */}
      <section className="border-t border-gold/40 bg-gradient-to-br from-[#0a4a36] to-[#052a1f] text-center text-white">
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
