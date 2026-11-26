import Link from "next/link";
import Footer from "@/components/Footer";
import { Header } from "@/components/Chrome";

export const metadata = { title: "Page not found — Abu Bakkar Academy" };

const LINKS: [string, string, string][] = [
  ["/", "Home", "Character Grooming and Academic Tuition in Pakistan"],
  ["/enroll", "Enroll", "Enroll your child in a live online class"],
  ["/quran", "Online Quran Classes", "One-to-one lessons for kids and adults"],
  ["/quran/uk", "Quran Classes UK", "Prices in pounds, lesson times in UK time"],
  ["/quran/usa", "Quran Classes USA", "Prices in US dollars, your time zone"],
  ["/quran/book-trial", "Book Free Quran Assessment", "A free 20–30 minute session"],
];

export default function NotFound() {
  return (
    <main>
      <div className="sticky top-0 z-50"><Header href="/enroll" /></div>
      <section className="bg-white text-navy">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center md:py-24">
          <p className="font-serif text-6xl font-bold text-gold md:text-7xl">404</p>
          <h1 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Sorry, this page doesn’t exist</h1>
          <p className="mt-3 text-lg text-slate-600">The link may be old or mistyped. These pages should help:</p>
          <ul className="mt-10 grid gap-4 text-left sm:grid-cols-2">
            {LINKS.map(([href, label, note]) => (
              <li key={href}>
                <Link href={href} className="block h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#0b5a3e] hover:shadow-md">
                  <span className="block font-bold text-[#0b5a3e]">{label} →</span>
                  <span className="mt-1 block text-sm text-slate-600">{note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Footer />
    </main>
  );
}
