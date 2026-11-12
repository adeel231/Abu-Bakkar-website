import { db, type EnrollmentRow, type PaymentRow } from "@/lib/db";
import { CLASS_TYPE_LABEL, formatPKR } from "@/lib/pricing";
import { checkReview } from "@/lib/reviewLink";
import { decidePayment } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment review", robots: { index: false, follow: false } };

type SP = { p?: string; a?: string; e?: string; u?: string; s?: string; done?: string; err?: string };

const Shell = ({ children }: { children: React.ReactNode }) => (
  <main className="min-h-screen bg-slate-50">
    <div className="mx-auto max-w-lg px-4 py-8">
      <p className="font-serif text-xl font-bold text-[#0b5a3e]">Abu Bakkar Academy</p>
      {children}
    </div>
  </main>
);
const Card = ({ children, tone = "white" }: { children: React.ReactNode; tone?: "white" | "green" | "red" | "gold" }) => (
  <div className={`mt-4 rounded-3xl p-5 shadow-sm ${tone === "green" ? "bg-emerald-50 text-emerald-900" : tone === "red" ? "bg-red-50 text-red-900" : tone === "gold" ? "bg-gold/15 text-navy" : "bg-white text-navy"}`}>{children}</div>
);

/** Opened from the email. Nothing changes until the admin presses the button on this page. */
export default async function PaymentReview({ searchParams }: { searchParams: SP }) {
  const v = checkReview(searchParams);
  if (!v.ok) {
    return <Shell><Card tone="red"><p className="font-bold">{v.reason === "expired" ? "This link has expired." : "This link is not valid."}</p><p className="mt-1 text-sm">Please review the payment in the admin panel instead.</p><a href="/admin/payments" className="mt-3 inline-block font-semibold underline">Open the admin panel</a></Card></Shell>;
  }

  const c = db();
  const { data: pay } = await c.from("payments").select("*").eq("id", v.p).maybeSingle();
  const p = pay as PaymentRow | null;
  const { data: enr } = p ? await c.from("enrollments").select("*").eq("id", p.enrollment_id).maybeSingle() : { data: null };
  const e = enr as EnrollmentRow | null;
  if (!p || !e) return <Shell><Card tone="red"><p className="font-bold">Payment not found.</p></Card></Shell>;

  if (searchParams.done) {
    return (
      <Shell>
        <Card tone={searchParams.done === "approved" ? "green" : "gold"}>
          <p className="text-lg font-bold">{searchParams.done === "approved" ? "Payment approved" : "Payment rejected"}</p>
          <p className="mt-1 text-sm">{searchParams.done === "approved" ? `${e.ref} is now enrolled. The parent gets the confirmation. Next: assign a class batch in the admin panel.` : `${e.ref} was rejected. The parent can upload the correct receipt.`}</p>
          <a href="/admin/enrollments" className="mt-3 inline-block font-semibold underline">Open the admin panel</a>
        </Card>
      </Shell>
    );
  }

  if (p.status !== "submitted") {
    const word = p.status === "verified" ? "approved" : p.status === "rejected" ? "rejected" : p.status;
    return <Shell><Card tone="gold"><p className="font-bold">This payment was already {word}.</p><p className="mt-1 text-sm">Enrollment {e.ref}. Nothing more to do.</p><a href="/admin/payments?view=all" className="mt-3 inline-block font-semibold underline">Open the admin panel</a></Card></Shell>;
  }

  let receipt: string | undefined;
  if (p.receipt_path) receipt = (await c.storage.from("receipts").createSignedUrl(p.receipt_path, 900)).data?.signedUrl;
  const pdf = p.receipt_path?.endsWith(".pdf");
  const approve = v.a === "approve";
  const rows: [string, string][] = [
    ["Enrollment", e.ref], ["Parent", `${e.parent_name} (WhatsApp ${e.whatsapp})`], ["Student", e.child_first_name],
    ["Package", [e.program_name, e.class_type ? CLASS_TYPE_LABEL[e.class_type] : "", e.package_label].filter(Boolean).join(" · ")],
    ["Amount to receive", formatPKR(p.amount_pkr)], ["Paid by", p.method], ["Transaction ID", p.txn_ref || "not given"],
  ];

  return (
    <Shell>
      <h1 className="mt-4 text-2xl font-bold text-navy">{approve ? "Approve this payment?" : "Reject this payment?"}</h1>
      {searchParams.err && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{searchParams.err}</p>}
      <Card>
        <dl className="divide-y divide-slate-100 text-sm">
          {rows.map(([k, val]) => <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-slate-500">{k}</dt><dd className="text-right font-semibold">{val}</dd></div>)}
        </dl>
        {receipt && (
          <a href={receipt} target="_blank" rel="noopener" className="mt-3 block">
            {pdf ? <span className="flex h-24 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 font-semibold">📄 Open PDF receipt</span>
              : <img src={receipt} alt={`Receipt for ${e.ref}`} className="max-h-72 w-full rounded-xl border border-slate-200 object-contain" />}
            <span className="mt-1 block text-center text-xs font-semibold text-emerald-700 underline">View full receipt</span>
          </a>
        )}
      </Card>

      <form action={decidePayment} className="mt-4 space-y-3">
        {(["p", "a", "e", "u", "s"] as const).map((k) => <input key={k} type="hidden" name={k} value={searchParams[k] ?? ""} />)}
        {approve ? (
          <>
            <label className="flex items-start gap-3 rounded-2xl bg-gold/15 p-4 text-sm text-navy">
              <input type="checkbox" name="confirm" value="yes" className="mt-1 h-5 w-5" />
              <span>I checked my JazzCash / Easypaisa / bank account and <b>{formatPKR(p.amount_pkr)}</b> has really been received. A receipt image alone can be edited.</span>
            </label>
            <button className="btn-emerald w-full !py-3.5 text-lg">Approve payment</button>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-navy" htmlFor="note">Reason for the parent (optional)</label>
            <input id="note" name="note" maxLength={300} className="input" placeholder="For example: amount does not match" />
            <button className="btn w-full bg-red-600 !py-3.5 text-lg text-white hover:bg-red-700">Reject payment</button>
          </>
        )}
        <a href={`/admin/payments`} className="block text-center text-sm text-slate-500 underline">Open the admin panel instead</a>
      </form>
    </Shell>
  );
}
