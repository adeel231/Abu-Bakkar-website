import { notFound } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Brand";
import PurchaseTracker, { PrintButton } from "@/components/PurchaseTracker";
import { db, dbConfigured, getSettings, type EnrollmentRow, type PaymentRow } from "@/lib/db";
import { CLASS_TYPE_LABEL, formatPKR } from "@/lib/pricing";
import { WHATSAPP } from "@/lib/contact";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enrollment — Abu Bakkar Academy", robots: { index: false } };

export default async function Confirmation({ params }: { params: { ref: string } }) {
  if (!dbConfigured() || !/^ABA-[A-Z0-9]{8}$/.test(params.ref)) notFound();
  const c = db();
  const { data } = await c.from("enrollments").select("*").eq("ref", params.ref).maybeSingle();
  const e = data as EnrollmentRow | null;
  if (!e) notFound();
  const [pay, batch, s] = await Promise.all([
    c.from("payments").select("*").eq("enrollment_id", e.id).order("submitted_at", { ascending: false }).limit(1),
    e.class_batch_id ? c.from("class_batches").select("name,timing,start_date,teacher,meeting_link").eq("id", e.class_batch_id).maybeSingle() : Promise.resolve({ data: null }),
    getSettings(),
  ]);
  const p = ((pay.data ?? [])[0] ?? null) as PaymentRow | null;
  const b = batch.data as { name: string; timing: string; start_date: string | null; teacher: string; meeting_link: string } | null;
  const verified = e.status === "verified";
  const waHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Assalamu Alaikum, my enrollment ID is " + e.ref)}`;
  const rows: [string, string][] = [
    ["Enrollment ID", e.ref], ["Student", e.child_first_name], ["Service", e.program_name ?? "—"],
    ["Class type", e.class_type ? CLASS_TYPE_LABEL[e.class_type] : "—"], ["Package", e.package_label ?? "—"],
    ...(e.subject_name ? [["Subject", e.subject_name] as [string, string]] : []),
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      {verified && <PurchaseTracker refCode={e.ref} amount={e.amount_pkr} />}
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-5 sm:py-8">
        <Logo />
        {verified ? (
          <>
            <h1 className="mt-5 font-serif text-3xl font-extrabold text-emerald-700">Congratulations! Your Child Is Enrolled at Abu Bakkar Academy.</h1>
            <div className="mt-5 space-y-3 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Receipt</p>
              {rows.map(([k, v]) => <Row key={k} k={k} v={v} />)}
              <Row k="Amount paid" v={formatPKR(p?.amount_received ?? e.amount_pkr)} />
              {p && <Row k="Payment" v={p.txn_ref ? `${p.method} · ${p.txn_ref}` : `${p.method} · receipt uploaded`} />}
              {e.verified_at && <Row k="Verified on" v={new Date(e.verified_at).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })} />}
            </div>
            <div className="mt-5 rounded-3xl bg-emerald-50 p-5 sm:p-6">
              <h2 className="font-bold text-emerald-700">Joining instructions</h2>
              {b ? (
                <dl className="mt-2 space-y-1 text-sm text-slate-700">
                  <div><b>Class:</b> {b.name}</div>
                  {b.timing && <div><b>Timing:</b> {b.timing}</div>}
                  {b.start_date && <div><b>Starts:</b> {new Date(b.start_date).toDateString()}</div>}
                  {b.teacher && <div><b>Teacher:</b> {b.teacher}</div>}
                  {b.meeting_link && <div><b>Join link:</b> <a className="underline" href={b.meeting_link} target="_blank" rel="noopener">{b.meeting_link}</a></div>}
                </dl>
              ) : <p className="mt-2 text-sm text-slate-700">Your class group and timing are being finalised. We will message you on WhatsApp with the class time and joining link.</p>}
              <p className="mt-3 text-sm text-slate-700">{s.whatsapp_joining_text}</p>
              <p className="mt-3 text-sm text-slate-600">A confirmation has also been sent to your WhatsApp{e.email ? " and email" : ""}. Keep your Enrollment ID.</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3"><PrintButton /><a className="btn-emerald print:hidden" href={waHref}>Message us on WhatsApp</a></div>
          </>
        ) : e.status === "rejected" ? (
          <>
            <h1 className="mt-5 font-serif text-3xl font-bold text-red-700">We could not verify your payment</h1>
            <p className="mt-3 text-slate-600">Please check your receipt and <Link className="underline" href={`/pay/${e.ref}`}>upload it again</Link>, or message us on WhatsApp.</p>
            <a className="btn-emerald mt-4" href={waHref}>Message us on WhatsApp</a>
          </>
        ) : e.status === "refunded" ? (
          <h1 className="mt-5 font-serif text-3xl font-bold text-navy">This enrollment was refunded</h1>
        ) : e.status === "payment_submitted" ? (
          <>
            <h1 className="mt-5 font-serif text-3xl font-bold text-navy">Payment received — we are verifying it</h1>
            <p className="mt-3 text-slate-600">
              Thank you. We are checking your {p?.method ?? "payment"} {p?.txn_ref ? `(ID ${p.txn_ref}) ` : ""}against our account. This usually takes a few hours.
              Your child is enrolled once it is verified, and you will get your confirmation and joining instructions on WhatsApp. Refresh this page to see the latest status.
            </p>
            <p className="mt-4 rounded-2xl bg-white p-4 shadow-sm">Enrollment ID: <b>{e.ref}</b> · Amount: <b>{formatPKR(e.amount_pkr)}</b></p>
            <a className="btn-emerald mt-4" href={waHref}>Message us on WhatsApp</a>
          </>
        ) : (
          <>
            <h1 className="mt-5 font-serif text-3xl font-bold text-navy">Your enrollment is saved</h1>
            <p className="mt-3 text-slate-600">It is not confirmed yet. Please complete your payment to confirm your child's seat.</p>
            <Link className="btn-gold mt-4" href={`/pay/${e.ref}`}>Go to payment</Link>
          </>
        )}
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 text-sm last:border-0"><span className="text-slate-500">{k}</span><span className="text-right font-semibold text-navy">{v}</span></div>;
}
