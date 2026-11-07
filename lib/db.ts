import { createClient } from "@supabase/supabase-js";

export type Program = {
  id: string; slug: string; name: string; description: string; age_group: string;
  sessions: number; duration_weeks: number; price_pkr: number; timings: string; teacher: string;
  start_date: string | null; seats_total: number; seats_taken: number;
  status: "open" | "coming_soon" | "closed"; sort: number;
};

export type Enrollment = {
  id: string; ref: string; parent_name: string; whatsapp: string; email: string | null;
  child_first_name: string; child_age: number; grade: string; city: string; program_id: string | null;
  preferred_schedule: string | null; amount_pkr: number; status: string; payment_method: string | null;
  payment_txn_id: string | null; payment_note: string | null; source: string | null;
  class_group: string | null; admin_notes: string | null; followed_up: boolean;
  created_at: string; verified_at: string | null;
};

export const dbConfigured = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export function db() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export async function getPrograms(includeClosed = false): Promise<Program[]> {
  if (!dbConfigured()) return [];
  let q = db().from("programs").select("*").order("sort");
  if (!includeClosed) q = q.neq("status", "closed");
  const { data } = await q;
  return (data as Program[]) ?? [];
}

export async function getSettings(): Promise<Record<string, string>> {
  if (!dbConfigured()) return {};
  const { data } = await db().from("settings").select("*");
  return Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));
}

export const seatsLeft = (p: Program) => Math.max(0, p.seats_total - p.seats_taken);

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newRef() {
  const b = crypto.getRandomValues(new Uint8Array(8));
  return "ABA-" + Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join("");
}

/** Normalise Pakistani mobile numbers to 92XXXXXXXXXX (no plus). Returns null if invalid. */
export function normalisePk(n: string): string | null {
  let d = n.replace(/\D/g, "");
  if (d.startsWith("0092")) d = d.slice(2);
  if (d.startsWith("0")) d = "92" + d.slice(1);
  return /^923\d{9}$/.test(d) ? d : null;
}

export const pkr = (n: number) => "PKR " + n.toLocaleString("en-PK");
