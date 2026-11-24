import { BookMarked, Calculator, ClipboardCheck, FlaskConical, Languages, Monitor, PenLine, Users, type LucideIcon } from "lucide-react";
import ServiceShell from "@/components/ServiceShell";
import { WhatsAppIcon } from "@/components/Chrome";
import { WHATSAPP } from "@/lib/contact";
import { getCatalog } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Academic Tutoring — Abu Bakkar Academy",
  alternates: { canonical: "/services/academic-tutoring" },
  description: "Live online tuition for school subjects from Grade 1 to Grade 10 at Abu Bakkar Academy.",
};

const ICONS: Record<string, LucideIcon> = {
  Mathematics: Calculator, English: Languages, Urdu: PenLine, Science: FlaskConical, Islamiyat: BookMarked, "Computer Science": Monitor,
};

/** How the tuition works. Only what the academy offers today (online, Grades 1 to 10). */
const HOW: [LucideIcon, string, string][] = [
  [Monitor, "Live online classes", "Your child studies from home in live classes with a teacher."],
  [Users, "Small online groups", "Children learn with others from a similar school grade."],
  [ClipboardCheck, "12 sessions every month", "A steady weekly routine that keeps your child on track."],
  [BookMarked, "All or compulsory subjects", "Choose every subject we teach or only the compulsory ones."],
];

const LEVELS: [string, string][] = [
  ["Grades 1 to 5", "Strong basics in reading, writing, numbers and good study habits."],
  ["Grades 6 to 8", "Clear concepts and regular practice as subjects become harder."],
  ["Grades 9 to 10", "Focused preparation for school tests and board exams."],
];

export default async function AcademicTutoringPage() {
  const c = await getCatalog();
  const subjects = c.subjects.map((s) => s.name);
  const msg = "Assalamu Alaikum, I want to know about Academic Tutoring at Abu Bakkar Academy.";
  return (
    <ServiceShell back>
      <section id="academic-tutoring" className="bg-white text-navy">
        <div className="section">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-gold">Academic Tutoring</p>
          <h1 className="h2 mt-2 text-center">Online Tuition for School Subjects</h1>

          {/* How it works */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW.map(([Icon, name, about]) => (
              <div key={name} className="rounded-3xl border border-[#e3d8bc] bg-white p-6 shadow-[0_2px_10px_rgba(80,60,10,0.08)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50"><Icon size={26} className="text-[#0b5a3e]" /></span>
                <h2 className="mt-4 font-serif text-xl font-bold text-[#0b5a3e]">{name}</h2>
                <p className="mt-2 leading-snug text-[#2f3b35]">{about}</p>
              </div>
            ))}
          </div>

          {/* Subjects */}
          <h2 className="mt-14 text-center font-serif text-3xl font-bold text-navy">Subjects</h2>
          <div className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-3">
            {subjects.map((s) => {
              const Icon = ICONS[s] ?? BookMarked;
              return (
                <div key={s} className="flex items-center gap-3 rounded-2xl border border-[#e3d8bc] bg-white px-4 py-4 font-bold text-navy">
                  <Icon size={22} className="shrink-0 text-[#0b5a3e]" />{s}
                </div>
              );
            })}
          </div>

          {/* Grade levels */}
          <h2 className="mt-14 text-center font-serif text-3xl font-bold text-navy">Grade Levels</h2>
          <div className="mx-auto mt-6 grid max-w-5xl gap-4 md:grid-cols-3">
            {LEVELS.map(([name, about]) => (
              <div key={name} className="rounded-3xl border border-[#e3d8bc] bg-white p-6 text-center shadow-[0_2px_10px_rgba(80,60,10,0.08)]">
                <h3 className="font-serif text-2xl font-bold text-[#0b5a3e]">{name}</h3>
                <p className="mt-2 text-[#2f3b35]">{about}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener"
              className="flex items-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 font-bold text-white shadow-lg shadow-[#25D366]/25 transition hover:brightness-105">
              <WhatsAppIcon className="h-6 w-6 shrink-0" /> Ask about Academic Tutoring on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </ServiceShell>
  );
}
