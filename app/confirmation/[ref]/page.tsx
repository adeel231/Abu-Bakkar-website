import { WHATSAPP } from "@/lib/contact";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Brand";
import Tracker from "@/components/Tracker";
import { db, dbConfigured, getSettings, pkr } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enrollment — Abu Bakkar Academy", robots: { index: false } };

export default async function Confirmation({ params }: { params: { ref: string } }) {
  if (!dbConfigured()) notFound();
  const { data: e } = await db().from("enrollments")
    .select("ref,status,amount_pkr,child_first_name,class_group,verified_at,payment_txn_id,payment_method,programs(name,start_date,timings)")
    .eq("ref", params.ref).single();
  if (!e) notFound();
  const s = await getSettings();
  const p: any = Array.isArray(e.programs) ? e.programs[0] : e.programs;
  const verified = e.status === "verified";
  const wa = WHATSAPP;

  return (
    <main className="min-h-screen bg-slate-50">
      {verified && <Tracker event="payment_verified" adOnly meta={["Purchase", { value: e.amount_pkr, currency: "PKR" }]} />}
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Logo />
        {verified ? (
          <>
            <h1 className="mt-6 text-3xl font-extrabold text-emerald-700">Congratulations! Your Child Is Enrolled at Abu Bakkar Academy.</h1>
            <div className="mt-6 space-y-3 rounded-3xl bg-white p-6 shadow-sm">
              <Row k="Enrollment ID" v={e.ref} />
              <Row k="Program" v={p?.name} />
              <Row k="Starting date" v={p?.start_date ? new Date(p.start_date).toDateString() : "To be confirmed — we will message you"} />
              <Row k="Class schedule" v={p?.timings || "To be confirmed"} />
              {e.class_group && <Row k="Class group" v={e.class_group} />}
              <Row k="Amount received" v={pkr(e.amount_pkr)} />
            </div>
            <div className="mt-6 rounded-3xl bg-emerald-50 p-6">
              <h2 className="font-bold text-emerald-700">Next steps</h2>
              <ol className="mt-2 list-decimal pl-5 text-slate-700">
                <li>{s.whatsapp_joining_text}</li>
                <li>Keep this Enrollment ID — it is your receipt.</li>
                <li>Save our WhatsApp number so you don’t miss class updates.</li>
              </ol>
            </div>
            <p className="mt-4 text-sm text-slate-500">Print this page (Ctrl/Cmd+P) to save your receipt.</p>
          </>
        ) : e.status === "rejected" ? (
          <>
            <h1 className="mt-6 text-3xl font-bold text-red-700">We couldn’t verify your payment</h1>
            <p className="mt-3 text-slate-600">Please check the transaction ID and <Link className="underline" href={`/pay/${e.ref}`}>submit it again</Link>, or message us on WhatsApp.</p>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-3xl font-bold text-navy">Payment received — verification in progress</h1>
            <p className="mt-3 text-slate-600">
              Thank you. We are verifying your {e.payment_method} payment (ID {e.payment_txn_id}). This usually takes a few hours.
              You will receive your enrollment confirmation and class joining instructions on WhatsApp. Refresh this page to check status.
            </p>
            <p className="mt-4 rounded-2xl bg-white p-4 shadow-sm">Enrollment reference: <b>{e.ref}</b></p>
          </>
        )}
        {wa && <a className="btn-emerald mt-6" href={`https://wa.me/${wa}?text=${encodeURIComponent("Assalamu Alaikum, my enrollment ID is " + e.ref)}`}>Message us on WhatsApp</a>}
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0"><span className="text-slate-500">{k}</span><span className="text-right font-semibold text-navy">{v}</span></div>;
}
