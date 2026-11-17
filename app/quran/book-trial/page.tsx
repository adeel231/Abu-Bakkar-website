import QuranShell from "@/components/quran/QuranShell";
import BookForm from "@/components/quran/BookForm";
import { Schema, meta } from "@/components/quran/parts";
import type { SeoPage } from "@/lib/quran";

const PAGE: SeoPage = { path: "/quran/book-trial", title: "Book a Free Quran Assessment | Abu Bakkar Academy", description: "Book a free 20–30 minute online Quran assessment with a qualified teacher. No card details needed.", h1: "Book Your Free Quran Assessment", priority: "P0" };
export const metadata = meta(PAGE);

export default function BookTrial({ searchParams }: { searchParams: { region?: string } }) {
  return (
    <QuranShell>
      <Schema page={PAGE} name="Book assessment" />
      <section className="bg-[#f4f8f5] px-4 py-10 md:py-16"><div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#0b5a3e]">{PAGE.h1}</h1>
        <p className="mt-2 text-slate-700">A free 20–30 minute live session to find your child&apos;s level.</p>
        <div className="mt-6 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-200 md:p-8"><BookForm defaultCountry={searchParams.region === "us" ? "United States" : "United Kingdom"} /></div>
      </div></section>
    </QuranShell>
  );
}
