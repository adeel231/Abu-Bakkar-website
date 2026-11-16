import { BookOpen, BookOpenCheck, Brain, Check, Languages, Lightbulb, Mic, type LucideIcon } from "lucide-react";
import ShareButton from "./ShareButton";
import { WhatsAppIcon } from "./Chrome";
import { WHATSAPP } from "@/lib/contact";

/** Quran courses offered. Keep the copy short and simple. */
const COURSES: [LucideIcon, string, string][] = [
  [BookOpen, "Nazra Quran", "Read the Quran step by step, from the Arabic letters to full ayahs, with correct pronunciation (makharij)."],
  [BookOpenCheck, "Tajweed", "Learn the rules of recitation such as Ghunnah, Qalqalah, Ikhfa and Idgham, and recite with confidence."],
  [Mic, "Qirat", "For advanced readers: recite beautifully with the right tone, rhythm and voice control."],
  [Brain, "Hifz-ul-Quran", "Memorize the Quran with a small daily lesson and a regular revision plan."],
  [Languages, "Quranic Arabic", "Understand the words and grammar of the Quran, one step at a time."],
  [Lightbulb, "Tafseer", "Learn the meaning and message of the ayahs in simple language."],
];

const POINTS = ["Live online classes from home", "Step by step from the basics", "For beginners and advanced readers"];

/** Services: Quran Teaching. Enquiries go to WhatsApp (it is not part of the online enrollment form yet). */
export default function QuranSection() {
  const msg = "Assalamu Alaikum, I want to know about Quran classes at Abu Bakkar Academy.";
  return (
    <section id="quran" className="relative bg-white text-navy">
      <ShareButton id="quran" corner="top-right" title="Online Quran Classes at Abu Bakkar Academy"
        text="Nazra and Tajweed and Hifz and Tafseer. Live online Quran classes at Abu Bakkar Academy." />
      <div className="section">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-gold">Quran Teaching</p>
        <h2 className="h2 mt-2 text-center">Online Quran Classes</h2>

        {/* Moving strip: the points slide from left to right. Two identical halves make the loop seamless. */}
        <div className="marquee mt-6 overflow-hidden rounded-2xl bg-[#0b5a3e] py-3 text-white" aria-label={POINTS.join(". ")}>
          <div className="marquee-track flex w-max" aria-hidden="true">
            {[0, 1].map((half) => (
              <ul key={half} className="flex shrink-0">
                {[...POINTS, ...POINTS, ...POINTS].map((x, i) => (
                  <li key={i} className="flex items-center gap-2 whitespace-nowrap px-6 text-base font-semibold md:text-lg">
                    <Check size={20} className="shrink-0 text-gold" />{x}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map(([Icon, name, about]) => (
            <div key={name} className="flex flex-col items-center rounded-3xl border border-[#e3d8bc] bg-white p-6 text-center shadow-[0_2px_10px_rgba(80,60,10,0.08)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50"><Icon size={26} className="text-[#0b5a3e]" /></span>
              <h3 className="mt-4 font-serif text-2xl font-bold text-[#0b5a3e]">{name}</h3>
              <p className="mt-2 leading-snug text-[#2f3b35]">{about}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener"
            className="flex items-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 font-bold text-white shadow-lg shadow-[#25D366]/25 transition hover:brightness-105">
            <WhatsAppIcon className="h-6 w-6 shrink-0" /> Ask about Quran classes on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
