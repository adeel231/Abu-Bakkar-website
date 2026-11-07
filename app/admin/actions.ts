"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkPassword, clearSession, issueSession, requireAdmin } from "@/lib/auth";
import { db, getSettings, type Program } from "@/lib/db";
import { sendConfirmation } from "@/lib/notify";

export async function login(fd: FormData) {
  if (!checkPassword(String(fd.get("password") || ""))) redirect("/admin/login?error=1");
  issueSession();
  redirect("/admin");
}

export async function logout() {
  clearSession();
  redirect("/admin/login");
}

export async function verifyPayment(fd: FormData) {
  requireAdmin();
  const id = String(fd.get("id"));
  const { data: e } = await db().from("enrollments").select("*, programs(*)").eq("id", id).single();
  if (!e || e.status === "verified") return;
  const p: Program = Array.isArray(e.programs) ? e.programs[0] : e.programs;

  const { data: upd } = await db().from("enrollments")
    .update({ status: "verified", verified_at: new Date().toISOString() })
    .eq("id", id).neq("status", "verified").select("id");
  if (!upd?.length) return;

  await db().from("programs").update({ seats_taken: p.seats_taken + 1 }).eq("id", p.id);
  await db().from("events").insert({ session_id: "server:" + e.ref, name: "payment_verified", source: e.source });

  const s = await getSettings();
  await sendConfirmation({
    ref: e.ref, parent_name: e.parent_name, whatsapp: e.whatsapp, email: e.email, child_first_name: e.child_first_name,
    program: p.name, amount: e.amount_pkr, start: p.start_date ? new Date(p.start_date).toDateString() : "To be confirmed",
    timings: p.timings || "To be confirmed", joining: s.whatsapp_joining_text || "",
  });
  revalidatePath("/admin");
}

export async function setStatus(fd: FormData) {
  requireAdmin();
  const status = String(fd.get("status"));
  if (!["rejected", "refunded", "payment_submitted"].includes(status)) return;
  const id = String(fd.get("id"));
  const { data: e } = await db().from("enrollments").select("status,program_id").eq("id", id).single();
  await db().from("enrollments").update({ status }).eq("id", id);
  // Free the seat if a verified enrollment is refunded.
  if (e?.status === "verified" && status === "refunded" && e.program_id) {
    const { data: p } = await db().from("programs").select("seats_taken").eq("id", e.program_id).single();
    if (p) await db().from("programs").update({ seats_taken: Math.max(0, p.seats_taken - 1) }).eq("id", e.program_id);
  }
  revalidatePath("/admin");
}

export async function updateEnrollment(fd: FormData) {
  requireAdmin();
  await db().from("enrollments").update({
    class_group: String(fd.get("class_group") || "") || null,
    admin_notes: String(fd.get("admin_notes") || "") || null,
    followed_up: fd.get("followed_up") === "on",
  }).eq("id", String(fd.get("id")));
  revalidatePath("/admin");
}

export async function updateProgram(fd: FormData) {
  requireAdmin();
  const n = (k: string) => Number(fd.get(k) || 0);
  await db().from("programs").update({
    name: String(fd.get("name")), description: String(fd.get("description")), age_group: String(fd.get("age_group")),
    sessions: n("sessions"), duration_weeks: n("duration_weeks") || 4, price_pkr: n("price_pkr"),
    timings: String(fd.get("timings")), teacher: String(fd.get("teacher")),
    start_date: String(fd.get("start_date") || "") || null,
    seats_total: n("seats_total"), status: String(fd.get("status")),
  }).eq("id", String(fd.get("id")));
  revalidatePath("/admin"); revalidatePath("/");
}

export async function updateSettings(fd: FormData) {
  requireAdmin();
  const keys = ["bank_details", "jazzcash_number", "easypaisa_number", "whatsapp_joining_text", "ad_spend_pkr", "hero_hook", "hero_sub", "promise_text"];
  await db().from("settings").upsert(keys.map((key) => ({ key, value: String(fd.get(key) ?? "") })));
  revalidatePath("/admin");
}
