// Pure pricing / selection helpers. No imports on purpose, so tests can run this file directly.
// The price a parent PAYS is always read from the database at checkout; these helpers only decide how it is DISPLAYED.

export type ClassType = "group" | "private";

export type Pkg = {
  id: string; program_id: string; class_type: ClassType; duration_key: string; label: string; months: number;
  price_pkr: number; sessions: number | null; schedule_note: string; sort: number; active: boolean;
};
export type AgeGroup = { id: string; code: string; label: string; min_age: number; max_age: number; focus: string; sort: number; active: boolean };

export const CLASS_TYPE_LABEL: Record<ClassType, string> = { group: "Online Group", private: "Private One-on-One" };

export const CLASS_TYPE_BLURB: Record<ClassType, string> = {
  group: "Your child learns live with other children of a similar age. Friendly, affordable and great for confidence.",
  private: "Your child gets the teacher's full attention in every session. Best for personal focus and flexible pace.",
};

export const formatPKR = (n: number) => "Rs. " + Math.round(n).toLocaleString("en-PK");

/** The standard one-month package of a plan (the price that is advertised). */
export function monthlyPackage(pkgs: Pkg[], programId: string, classType: ClassType): Pkg | undefined {
  return pkgs.find((p) => p.program_id === programId && p.class_type === classType && p.months === 1);
}

/** Packages of one plan, cheapest term first. */
export function plan(pkgs: Pkg[], programId: string, classType: ClassType): Pkg[] {
  return pkgs.filter((p) => p.program_id === programId && p.class_type === classType && p.active)
    .sort((a, b) => a.months - b.months || a.sort - b.sort);
}

/** How much a multi-month package saves compared with paying monthly. */
export function savings(p: Pkg, monthly: Pkg | undefined): number {
  if (!monthly || p.months <= 1) return 0;
  return Math.max(0, monthly.price_pkr * p.months - p.price_pkr);
}

export const perMonth = (p: Pkg) => Math.round(p.price_pkr / Math.max(1, p.months));

/** The one number shown as "total payable" — always exactly the selected package's price. */
export const totalPayable = (p: Pkg) => p.price_pkr;

/** Age groups a student of this age may join. Boundary ages (8 and 12) fit two groups; admin confirms placement. */
export function groupsForAge(age: number, groups: AgeGroup[]): AgeGroup[] {
  return groups.filter((g) => g.active && age >= g.min_age && age <= g.max_age).sort((a, b) => a.sort - b.sort);
}

export const isBoundaryAge = (age: number, groups: AgeGroup[]) => groupsForAge(age, groups).length > 1;

/** A saved payment-detail setting is only "real" if it isn't empty or an obvious placeholder. */
export function isConfigured(v: string | undefined | null): boolean {
  const s = (v ?? "").trim();
  return s.length > 0 && !/<[^>]*>|X{3,}|\.\.\./i.test(s);
}

/** Normalise a Pakistani mobile number to 92XXXXXXXXXX (no plus). Returns null if it is not a valid mobile. */
export function normalisePk(n: string): string | null {
  let d = (n || "").replace(/\D/g, "");
  if (d.startsWith("0092")) d = d.slice(2);
  if (d.startsWith("0")) d = "92" + d.slice(1);
  return /^923\d{9}$/.test(d) ? d : null;
}

/** Limited-seats rule: capacity must actually exist and be nearly used up. */
export function isLimited(hasBatches: boolean, seatsLeft: number, threshold: number): boolean {
  return hasBatches && seatsLeft > 0 && seatsLeft <= Math.max(1, threshold);
}

export type BatchLite = { id: string; name: string; program_id: string; class_type: ClassType | null; age_group_id: string | null; timing: string; capacity: number; left: number; active: boolean };

/** Seats left in the batches that match a choice. hasBatches = false means no capacity has been set up yet (no restriction). */
export function seatsFor(batches: BatchLite[], programId: string, classType: ClassType, ageGroupId: string | null) {
  const m = batches.filter((b) => b.active && b.program_id === programId && (!b.class_type || b.class_type === classType)
    && (!ageGroupId || !b.age_group_id || b.age_group_id === ageGroupId));
  return { hasBatches: m.length > 0, left: m.reduce((s, b) => s + Math.max(0, b.left), 0), batches: m };
}
