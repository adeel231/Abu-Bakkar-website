import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/Brand";
import Tracker from "@/components/Tracker";
import PayForm from "./PayForm";
import { db, dbConfigured, getSettings, type EnrollmentRow } from "@/lib/db";
import { CLASS_TYPE_LABEL, formatPKR, isConfigured } from "@/lib/pricing";
import { WHATSAPP } from "@/lib/contact";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment — Abu Bakkar Academy", robots: { index: false } };

export default async function PayPage({ params }: { params: { ref: string } }) {
  if (!dbConfigured() || !/^ABA-[A-Z0-9]{8}$/.test(params.ref)) notFound();
  const { data } = await db().from("enrollments").select("*").eq("ref", params.ref).maybeSingle();
  const e = data as EnrollmentRow | null;
  if (!e) notFound();
  if (["payment_submitted", "verified"].includes(e.status)) redirect(`/confirmation/${e.ref}`);

  const s = await getSettings();
  const methods = [
    { name: "JazzCash", detail: s.jazzcash_number, how: "Send the amount to this JazzCash account." },
    { name: "Easypaisa", detail: s.easypaisa_number, how: "Send the amount to this Easypaisa account." },
    { name: "Bank transfer", detail: s.bank_details, how: "Transfer the amount to this bank account." },
  ];
  const ready = methods.filter((m) => isConfigured(m.detail));
  const waMsg = `Assalamu Alaikum, my enrollment ID is ${e.ref}. Please share the payment details.`;

  return (
    <main className="min-h-screen bg-slate-50">
      <Tracker event="payment_started" meta={["InitiateCheckout", { value: e.amount_pkr, currency: "PKR" }, "begin_checkout"]} />
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-5 sm:py-8">
        <Logo />
        <h1 className="mt-5 font-serif text-3xl font-bold text-navy">Complete Your Payment</h1>

        {e.status === "rejected" && (
          <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
            We could not find your previous payment. Please check the transaction ID and submit it again, or message us on WhatsApp.
          </p>
        )}
        {e.status === "refunded" && <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-slate-700">This enrollment was refunded and is closed. Please start a new enrollment.</p>}

        <div className="mt-5 rounded-3xl bg-navy p-6 text-white">
          <p className="text-sm text-white/70">Enrollment ID</p>
          <p className="text-2xl font-extrabold tracking-wider text-gold">{e.ref}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-white/70">Service</dt><dd className="font-semibold">{e.program_name ?? "Enrollment"}</dd></div>
            <div><dt className="text-white/70">Class type</dt><dd className="font-semibold">{e.class_type ? CLASS_TYPE_LABEL[e.class_type] : "—"}</dd></div>
            <div><dt className="text-white/70">Package</dt><dd className="font-semibold">{e.package_label ?? "—"}</dd></div>
            <div><dt className="text-white/70">Student</dt><dd className="font-semibold">{e.child_first_name}</dd></div>
          </dl>
          <p className="mt-5 text-sm text-white/70">Total payable</p>
          <p className="text-4xl font-extrabold">{formatPKR(e.amount_pkr)}</p>
        </div>

        <div className="mt-5 space-y-3 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-navy">Step 1 — Send the payment</h2>
          {ready.length > 0 ? (
            <>
              <p className="text-sm text-slate-600">Pay <b>{formatPKR(e.amount_pkr)}</b> by any one method below. Write <b>{e.ref}</b> in the reference / comment if you can.</p>
              {ready.map((m) => (
                <div key={m.name} className="rounded-2xl bg-emerald-50 p-4">
                  <p className="font-semibold text-emerald-700">{m.name}</p>
                  <p className="whitespace-pre-line text-slate-800">{m.detail}</p>
                </div>
              ))}
            </>
          ) : (
            <div className="rounded-2xl bg-gold/15 p-4 text-sm text-navy">
              <p className="font-semibold">Payment account details are shared on WhatsApp.</p>
              <p className="mt-1">Tap the button below. Your enrollment is already saved under <b>{e.ref}</b>.</p>
              <a className="btn-emerald mt-3" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener">Get payment details on WhatsApp</a>
            </div>
          )}
        </div>

        {e.status !== "refunded" && <PayForm refCode={e.ref} methods={ready.length ? ready.map((m) => m.name) : ["JazzCash", "Easypaisa", "Bank transfer"]} amount={e.amount_pkr} />}

        <p className="mt-6 text-sm text-slate-600">
          Your child is enrolled only after we verify your payment. We never approve a payment from a screenshot. If a class cannot start, you get a full refund.
          Read our <a className="underline" href="/refund-policy" target="_blank">Refund Policy</a>.
        </p>
      </div>
    </main>
  );
}
