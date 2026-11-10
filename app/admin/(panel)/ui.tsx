import type { ReactNode } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function Flash({ sp }: { sp: { msg?: string; err?: string } }) {
  if (sp.err) return (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />{sp.err}
    </p>
  );
  if (sp.msg) return (
    <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
      <CheckCircle2 size={18} className="mt-0.5 shrink-0" />{sp.msg}
    </p>
  );
  return null;
}

/** KPI tile: label, big value, optional icon and hint line. `hot` highlights something that needs action. */
export const Stat = ({ l, v, hot, icon: Icon, hint }: { l: string; v: string; hot?: boolean; icon?: LucideIcon; hint?: string }) => (
  <div className={`h-full rounded-2xl border p-4 transition md:p-5 ${hot ? "border-gold bg-gold-50 shadow-md shadow-gold/10" : "border-slate-200/80 bg-white shadow-sm hover:shadow-md"}`}>
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{l}</p>
      {Icon && (
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${hot ? "bg-gold text-navy" : "bg-emerald-50 text-emerald-700"}`}>
          <Icon size={16} />
        </span>
      )}
    </div>
    <p className="mt-2 text-2xl font-bold tracking-tight text-navy md:text-[1.7rem]">{v}</p>
    {hint && <p className={`mt-1 text-xs ${hot ? "font-semibold text-navy" : "text-slate-500"}`}>{hint}</p>}
  </div>
);

const TONE: Record<string, string> = {
  verified: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  payment_submitted: "bg-amber-50 text-amber-800 ring-amber-600/20",
  submitted: "bg-amber-50 text-amber-800 ring-amber-600/20",
  payment_started: "bg-sky-50 text-sky-700 ring-sky-600/20",
  pending: "bg-slate-100 text-slate-600 ring-slate-500/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
  refunded: "bg-slate-100 text-slate-700 ring-slate-500/20",
};
const DOT: Record<string, string> = {
  verified: "bg-emerald-500", payment_submitted: "bg-amber-500", submitted: "bg-amber-500", payment_started: "bg-sky-500",
  rejected: "bg-red-500", refunded: "bg-slate-400", pending: "bg-slate-400",
};
const NAME: Record<string, string> = { payment_submitted: "payment submitted", payment_started: "payment started" };
export const Badge = ({ s }: { s: string }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${TONE[s] ?? "bg-slate-100 text-slate-600 ring-slate-500/20"}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${DOT[s] ?? "bg-slate-400"}`} aria-hidden />{NAME[s] ?? s}
  </span>
);

export const Section = ({ title, children, action, desc }: { title: string; children: ReactNode; action?: ReactNode; desc?: string }) => (
  <section>
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-navy md:text-xl">{title}</h2>
        {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const Field = ({ n, l, v, t = "text", req }: { n: string; l: string; v?: string | number | null; t?: string; req?: boolean }) => (
  <div><label className="label">{l}</label><input name={n} type={t} defaultValue={v ?? ""} required={req} className="input !py-2" /></div>
);

export const when = (iso: string | null | undefined) => iso ? new Date(iso).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) : "—";
export const waLink = (num: string, text: string) => `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
