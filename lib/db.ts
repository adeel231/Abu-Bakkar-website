import { createClient } from "@supabase/supabase-js";
import { isLimited, seatsFor, type AgeGroup, type ClassType, type Pkg } from "./pricing";
import { DEFAULT_AGE_GROUPS, DEFAULT_PACKAGES, DEFAULT_PROGRAMS, DEFAULT_SUBJECTS } from "./defaults";

export { normalisePk, formatPKR as pkr, seatsFor } from "./pricing";

export type Program = {
  id: string; slug: string; name: string; description: string; age_group: string; sessions: number; duration_weeks: number;
  status: "open" | "coming_soon" | "closed"; sort: number; kind: "character" | "tuition"; is_main: boolean; tagline: string;
};
export type Subject = { id: string; name: string; sort: number; active: boolean };
export type Batch = {
  id: string; name: string; program_id: string; class_type: ClassType | null; age_group_id: string | null; timing: string;
  start_date: string | null; capacity: number; teacher: string; meeting_link: string; active: boolean; taken: number; left: number;
};
export type Catalog = {
  fromDb: boolean; programs: Program[]; packages: Pkg[]; ageGroups: AgeGroup[]; subjects: Subject[]; batches: Batch[];
  threshold: number;
};

export type EnrollmentRow = {
  id: string; ref: string; parent_id: string | null; student_id: string | null; parent_name: string; whatsapp: string; email: string | null;
  child_first_name: string; child_age: number | null; grade: string | null; city: string; program_id: string | null; program_name: string | null;
  class_type: ClassType | null; duration_key: string | null; term_months: number | null; package_label: string | null; package_id: string | null;
  age_group_id: string | null; subject_name: string | null; class_batch_id: string | null; preferred_batch_id: string | null;
  preferred_schedule: string | null; amount_pkr: number; status: string; payment_method: string | null; payment_txn_id: string | null;
  source: string | null; utm: Record<string, string> | null; admin_notes: string | null; followed_up: boolean;
  created_at: string; verified_at: string | null; class_group: string | null;
};
export type PaymentRow = {
  id: string; enrollment_id: string; method: string; txn_ref: string; amount_pkr: number; amount_received: number | null;
  status: "submitted" | "verified" | "rejected" | "refunded"; note: string | null; submitted_at: string; verified_at: string | null;
  verified_by: string | null; admin_note: string | null; receipt_path: string | null;
};

export const dbConfigured = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export function db() {
  // Never let Next.js cache database responses: prices, seats and payment status must always be live.
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

export async function getSettings(): Promise<Record<string, string>> {
  if (!dbConfigured()) return {};
  try {
    const { data } = await db().from("settings").select("*");
    return Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));
  } catch { return {}; }
}

/** How many parents have pressed "I Support This Promise" (one per browser). */
export async function getPromiseCount(): Promise<number> {
  if (!dbConfigured()) return 0;
  try {
    const { count } = await db().from("events").select("id", { count: "exact", head: true }).eq("name", "promise_support");
    return count ?? 0;
  } catch { return 0; }
}

/** True when real capacity exists and is nearly used up for any choice in this program. */
export function programLimited(c: Catalog, programId: string): boolean {
  const prog = c.programs.find((p) => p.id === programId);
  if (!prog) return false;
  const types = Array.from(new Set(c.packages.filter((p) => p.program_id === programId).map((p) => p.class_type)));
  const groups: (string | null)[] = prog.kind === "character" ? c.ageGroups.map((g) => g.id) : [null];
  return types.some((t) => groups.some((g) => { const s = seatsFor(c.batches, programId, t, g); return isLimited(s.hasBatches, s.left, c.threshold); }));
}

export const anyLimited = (c: Catalog) => c.programs.some((p) => p.status === "open" && programLimited(c, p.id));

/** Everything the public pages need. Falls back to display-only defaults when the database is unreachable. */
export async function getCatalog(): Promise<Catalog> {
  const fallback: Catalog = {
    fromDb: false, programs: DEFAULT_PROGRAMS, packages: DEFAULT_PACKAGES, ageGroups: DEFAULT_AGE_GROUPS,
    subjects: DEFAULT_SUBJECTS, batches: [], threshold: 10,
  };
  if (!dbConfigured()) return fallback;
  try {
    const c = db();
    const [pr, pk, ag, sb, bt, en, st] = await Promise.all([
      c.from("programs").select("*").neq("status", "closed").order("sort"),
      c.from("packages").select("*").eq("active", true).order("sort"),
      c.from("age_groups").select("*").eq("active", true).order("sort"),
      c.from("subjects").select("*").eq("active", true).order("sort"),
      c.from("class_batches").select("*").eq("active", true).order("created_at"),
      c.from("enrollments").select("class_batch_id").eq("status", "verified").not("class_batch_id", "is", null),
      c.from("settings").select("*").eq("key", "limited_seats_threshold"),
    ]);
    if (pr.error || pk.error || !pr.data?.length || !pk.data?.length) return fallback;
    const taken: Record<string, number> = {};
    for (const e of (en.data ?? []) as any[]) taken[e.class_batch_id] = (taken[e.class_batch_id] || 0) + 1;
    const batches: Batch[] = ((bt.data ?? []) as any[]).map((b) => ({ ...b, taken: taken[b.id] || 0, left: Math.max(0, b.capacity - (taken[b.id] || 0)) }));
    return {
      fromDb: true, programs: pr.data as Program[], packages: pk.data as Pkg[], ageGroups: (ag.data ?? []) as AgeGroup[],
      subjects: (sb.data ?? []) as Subject[], batches, threshold: Number((st.data as any)?.[0]?.value) || 10,
    };
  } catch { return fallback; }
}
