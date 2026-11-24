import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, type LucideIcon } from "lucide-react";
import ServiceShell from "@/components/ServiceShell";

export const metadata = {
  title: "Our Services — Abu Bakkar Academy",
  alternates: { canonical: "/services" },
  description: "Online Quran classes and online academic tutoring for Grades 1 to 10 at Abu Bakkar Academy.",
};

const SERVICES: [string, LucideIcon, string, string, string[]][] = [
  ["/quran", BookOpen, "Online Quran Classes", "Live one-to-one Quran lessons with qualified male and female teachers.",
    ["Noorani Qaida", "Nazra", "Tajweed", "Hifz"]],
  ["/services/academic-tutoring", GraduationCap, "Academic Tutoring", "Live online tuition for school subjects from Grade 1 to Grade 10.",
    ["Mathematics", "English", "Urdu", "Science", "Islamiyat", "Computer Science"]],
];

export default function ServicesPage() {
  return (
    <ServiceShell>
      <section className="bg-white text-navy">
        <div className="section">
          <h1 className="h2 text-center">Our Services</h1>
          <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
            {SERVICES.map(([href, Icon, title, about, tags]) => (
              <Link key={href} href={href}
                className="group flex flex-col items-center rounded-3xl text-center border border-[#e3d8bc] bg-white p-6 shadow-[0_2px_10px_rgba(80,60,10,0.08)] transition hover:-translate-y-0.5 hover:border-emerald hover:shadow-lg md:p-8">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50"><Icon size={30} className="text-[#0b5a3e]" /></span>
                <h2 className="mt-5 font-serif text-3xl font-bold text-[#0b5a3e]">{title}</h2>
                <p className="mt-2 text-lg text-[#2f3b35]">{about}</p>
                <ul className="mt-5 flex flex-wrap justify-center gap-2">
                  {tags.map((t) => <li key={t} className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">{t}</li>)}
                </ul>
                <span className="mt-auto pt-7"><span className="btn-gold inline-flex items-center gap-2 !px-6 !py-2.5">View details <ArrowRight size={18} className="transition group-hover:translate-x-1" /></span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </ServiceShell>
  );
}
