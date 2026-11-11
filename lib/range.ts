// Date ranges for the admin dashboard. Days are Pakistan days (UTC+5, no daylight saving), so "Today" means today in Pakistan.
export type RangeKey = "today" | "7d" | "30d" | "all" | "custom";
export const PRESETS: [RangeKey, string][] = [["today", "Today"], ["7d", "7 days"], ["30d", "30 days"], ["all", "All time"]];

export type Range = {
  key: RangeKey;
  /** Inclusive start and EXCLUSIVE end, as ISO timestamps. Both null = all time. */
  start: string | null; end: string | null;
  fromStr: string; toStr: string; label: string;
};

const TZ = "Asia/Karachi";
export const dayOf = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });                 // YYYY-MM-DD
const validDay = (s: string | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime());
const addDays = (s: string, n: number) => { const d = new Date(`${s}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const startOfDay = (s: string) => new Date(`${s}T00:00:00+05:00`).toISOString();
const pretty = (s: string) => new Date(`${s}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function resolveRange(sp: { range?: string; from?: string; to?: string }, now = new Date()): Range {
  const today = dayOf(now);
  let key = (PRESETS.some(([k]) => k === sp.range) || sp.range === "custom" ? sp.range : "all") as RangeKey;
  let from = "", to = "";
  if (key === "today") { from = to = today; }
  else if (key === "7d") { from = addDays(today, -6); to = today; }
  else if (key === "30d") { from = addDays(today, -29); to = today; }
  else if (key === "custom") {
    const f = validDay(sp.from) ? sp.from : "", t = validDay(sp.to) ? sp.to : "";
    if (!f && !t) key = "all";
    else { from = f || t; to = t || f; if (from > to) [from, to] = [to, from]; }
  }
  if (key === "all") return { key, start: null, end: null, fromStr: "", toStr: "", label: "All time" };
  return {
    key, start: startOfDay(from), end: startOfDay(addDays(to, 1)), fromStr: from, toStr: to,
    label: from === to ? pretty(from) : `${pretty(from)} – ${pretty(to)}`,
  };
}
