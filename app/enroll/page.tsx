import Link from "next/link";
import { Logo } from "@/components/Brand";
import Tracker from "@/components/Tracker";
import { AnnouncementBar } from "@/components/Chrome";
import EnrollWizard from "./EnrollWizard";
import { getCatalog, getSettings } from "@/lib/db";
import { WHATSAPP, WHATSAPP_PRETTY } from "@/lib/contact";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enroll — Abu Bakkar Academy" };

export default async function EnrollPage({ searchParams }: { searchParams: { program?: string; type?: string; term?: string } }) {
  const [c, settings] = await Promise.all([getCatalog(), getSettings()]);
  const timingOptions = (settings.timing_options || "Morning (9 AM – 12 PM)\nAfternoon (12 PM – 4 PM)\nEvening (4 PM – 8 PM)\nNight (8 PM – 10 PM)")
    .split("\n").map((s) => s.trim()).filter(Boolean);
  const programs = c.programs.filter((p) => p.status === "open")
    .map((p) => ({ id: p.id, slug: p.slug, name: p.name, kind: p.kind, tagline: p.tagline, description: p.description }));

  return (
    <main className="min-h-screen bg-slate-50">
      <Tracker event="form_view" meta={["ViewContent", { content_name: "enroll" }]} />
      {/* Same top strip as the home page: phone number always visible */}
      <div className="sticky top-0 z-50"><AnnouncementBar /></div>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-5 sm:py-8">
        <Logo />
        <h1 className="mt-5 font-serif text-3xl font-bold text-navy">Enroll Your Child</h1>
        <p className="mt-1 text-slate-600">Takes about 2 minutes.</p>

        {/* Display prices from the built-in fallback are never used for checkout. */}
        {!c.fromDb || programs.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Assalamu Alaikum, I want to enroll my child.")}`} className="btn-emerald">Enroll on WhatsApp: {WHATSAPP_PRETTY}</a>
            <Link href="/" className="btn mt-2 text-navy underline">Back to home</Link>
          </div>
        ) : (
          <div className="mt-6">
            <EnrollWizard
              programs={programs} packages={c.packages.filter((k) => k.months === 1 && k.class_type === "group")} ageGroups={c.ageGroups}
              subjects={c.subjects.map((s) => ({ id: s.id, name: s.name }))}
              batches={c.batches.map((b) => ({ id: b.id, name: b.name, program_id: b.program_id, class_type: b.class_type, age_group_id: b.age_group_id, timing: b.timing, capacity: b.capacity, left: b.left, active: b.active }))}
              timingOptions={timingOptions} threshold={c.threshold} whatsapp={WHATSAPP}
              initial={{ program: searchParams.program, type: searchParams.type, term: searchParams.term }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
