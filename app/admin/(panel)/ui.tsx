import type { ReactNode } from "react";

export function Flash({ sp }: { sp: { msg?: string; err?: string } }) {
  if (sp.err) return <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{sp.err}</p>;
  if (sp.msg) return <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{sp.msg}</p>;
  return null;
}

export const Stat = ({ l, v, hot }: { l: string; v: string; hot?: boolean }) => (
  <div className={`rounded-2xl p-4 shadow-sm ${hot ? "bg-gold/15 ring-2 ring-gold" : "bg-white"}`}>
    <p className="text-xs text-slate-500">{l}</p><p className="text-xl font-bold text-navy">{v}</p>
  </div>
);

const TONE: Record<string, string> = {
  verified: "bg-emerald-50 text-emerald-700", payment_submitted: "bg-gold/20 text-navy", pending: "bg-slate-100 text-slate-600",
  rejected: "bg-red-50 text-red-700", refunded: "bg-slate-200 text-slate-700", submitted: "bg-gold/20 text-navy",
};
const NAME: Record<string, string> = { payment_submitted: "payment submitted", payment_started: "payment started" };
export const Badge = ({ s }: { s: string }) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[s] ?? "bg-slate-100 text-slate-600"}`}>{NAME[s] ?? s}</span>;

export const Section = ({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) => (
  <section><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold text-navy">{title}</h2>{action}</div>{children}</section>
);

export const Field = ({ n, l, v, t = "text", req }: { n: string; l: string; v?: string | number | null; t?: string; req?: boolean }) => (
  <div><label className="label">{l}</label><input name={n} type={t} defaultValue={v ?? ""} required={req} className="input !py-2" /></div>
);

export const when = (iso: string | null | undefined) => iso ? new Date(iso).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) : "—";
export const waLink = (num: string, text: string) => `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
