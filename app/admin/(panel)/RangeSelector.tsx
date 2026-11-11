import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PRESETS, dayOf, type Range } from "@/lib/range";

const chip = (on: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${on ? "bg-navy text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`;

/** Four quick choices and one "Custom" button that opens a from/to form. A plain GET form: works without JavaScript. */
export default function RangeSelector({ range }: { range: Range }) {
  const today = dayOf(new Date());
  const custom = range.key === "custom";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map(([k, label]) => (
        <Link key={k} href={k === "all" ? "/admin" : `/admin?range=${k}`} aria-current={range.key === k ? "true" : undefined} className={chip(range.key === k)}>{label}</Link>
      ))}

      <details className="group relative" open={custom}>
        <summary className={`${chip(custom)} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
          <CalendarDays size={15} />{custom ? range.label : "Custom"}
        </summary>
        <form method="get" action="/admin" className="absolute left-0 top-full z-20 mt-2 flex w-72 flex-col gap-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
          <input type="hidden" name="range" value="custom" />
          <div><label htmlFor="r-from" className="label">From</label><input id="r-from" type="date" name="from" max={today} defaultValue={custom ? range.fromStr : ""} required className="input !py-2" /></div>
          <div><label htmlFor="r-to" className="label">To</label><input id="r-to" type="date" name="to" max={today} defaultValue={custom ? range.toStr : ""} required className="input !py-2" /></div>
          <button className="btn-emerald !py-2 text-sm">Apply</button>
        </form>
      </details>
    </div>
  );
}
