import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/Brand";
import Tracker from "@/components/Tracker";
import PayForm from "./PayForm";
import { db, dbConfigured, getSettings, pkr } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment — Abu Bakkar Academy", robots: { index: false } };

export default async function PayPage({ params }: { params: { ref: string } }) {
  if (!dbConfigured()) notFound();
  const { data: e } = await db().from("enrollments").select("ref,status,amount_pkr,child_first_name,programs(name)").eq("ref", params.ref).single();
  if (!e) notFound();
  if (["payment_submitted", "verified"].includes(e.status)) redirect(`/confirmation/${e.ref}`);
  const s = await getSettings();
  const prog: any = Array.isArray(e.programs) ? e.programs[0] : e.programs;

  return (
    <main className="min-h-screen bg-slate-50">
      <Tracker event="payment_started" meta={["AddPaymentInfo", { value: e.amount_pkr, currency: "PKR" }]} />
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Logo />
        <h1 className="mt-6 text-3xl font-bold text-navy">Complete Your Payment</h1>
        <div className="mt-6 rounded-3xl bg-navy p-6 text-white">
          <p className="text-sm text-white/70">Enrollment reference</p>
          <p className="text-2xl font-extrabold tracking-wider text-gold">{e.ref}</p>
          <p className="mt-4 text-sm text-white/70">Program</p>
          <p className="font-semibold">{prog?.name}</p>
          <p className="mt-4 text-sm text-white/70">Amount payable</p>
          <p className="text-4xl font-extrabold">{pkr(e.amount_pkr)}</p>
        </div>

        <div className="mt-6 space-y-4 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-navy">Pay by any one method</h2>
          <p className="text-sm text-slate-600">Write <b>{e.ref}</b> in the payment reference/comment where possible.</p>
          {[["JazzCash", s.jazzcash_number], ["Easypaisa", s.easypaisa_number], ["Bank transfer", s.bank_details]].map(([t, v]) => (
            <div key={t} className="rounded-2xl bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-700">{t}</p>
              <p className="whitespace-pre-line text-slate-700">{v || "Details coming soon"}</p>
            </div>
          ))}
        </div>

        <PayForm refCode={e.ref} />

        <p className="mt-6 text-sm text-slate-600">
          Your seat is confirmed only after we verify your payment. If the batch cannot launch you receive a full refund.
          See our <a className="underline" href="/refund-policy" target="_blank">Refund &amp; Cancellation Policy</a>.
        </p>
      </div>
    </main>
  );
}
