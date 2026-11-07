import Link from "next/link";
import { Logo } from "@/components/Brand";
import Tracker from "@/components/Tracker";
import EnrollForm from "./EnrollForm";
import { getPrograms, seatsLeft } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enroll — Abu Bakkar Academy" };

export default async function EnrollPage({ searchParams }: { searchParams: { program?: string } }) {
  const all = await getPrograms();
  const open = all
    .filter((p) => p.status === "open" && p.price_pkr > 0 && seatsLeft(p) > 0)
    .map((p) => ({ slug: p.slug, name: p.name, price: p.price_pkr, age: p.age_group, timings: p.timings, seats: seatsLeft(p) }));

  return (
    <main className="min-h-screen bg-slate-50">
      <Tracker event="form_view" meta={["InitiateCheckout", { content_name: "enroll" }]} />
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Logo />
        <h1 className="mt-6 text-3xl font-bold text-navy">Secure Your Child’s Seat</h1>
        <p className="mt-2 text-slate-600">Fill in the details below, then pay to confirm your enrollment.</p>
        {open.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <p className="font-semibold text-navy">Enrollment is not open right now.</p>
            <p className="mt-1 text-slate-600">Seats open once teachers, schedules and dates are confirmed.</p>
            <Link href="/" className="btn-emerald mt-4">Back to home</Link>
          </div>
        ) : (
          <EnrollForm programs={open} selected={searchParams.program} />
        )}
      </div>
    </main>
  );
}
