"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { attemptLogin, clearSession, hashPassword, requireAdmin, verifyPassword } from "@/lib/auth";
import { db, getSettings } from "@/lib/db";
import { friendly } from "@/lib/errors";
import { CLASS_TYPE_LABEL, formatPKR } from "@/lib/pricing";
import { sendConfirmation, sendMetaPurchase } from "@/lib/notify";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const int = (fd: FormData, k: string) => { const n = Number(str(fd, k)); return Number.isFinite(n) ? Math.round(n) : NaN; };
const uuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

/** Go back to a page with a success (msg) or error (err) banner. */
function back(path: string, kind: "msg" | "err", text: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(text)}`);
}
const here = (fd: FormData, fallback: string) => { const r = str(fd, "return"); return r.startsWith("/admin") ? r : fallback; };

// ---------------------------------------------------------------------------------------------------- session
export async function login(fd: FormData) {
  const r = await attemptLogin(str(fd, "email"), String(fd.get("password") ?? ""));
  if (!r.ok) redirect("/admin/login?error=" + encodeURIComponent(r.error));
  redirect("/admin");
}
export async function logout() { clearSession(); redirect("/admin/login"); }

// ---------------------------------------------------------------------------------------------------- payments
/** Approve a payment AFTER the admin has seen the money in the bank / wallet statement. */
export async function verifyPayment(fd: FormData) {
  const admin = await requireAdmin();
  const ret = here(fd, "/admin/payments");
  const id = str(fd, "payment_id"), received = int(fd, "received");
  if (!uuid(id) || !Number.isFinite(received)) back(ret, "err", "Enter the amount you received.");
  const c = db();
  const { data, error } = await c.rpc("verify_payment", { p_payment: id, p_admin: admin.email, p_received: received });
  if (error) back(ret, "err", friendly(error));
  const { ref, enrollment_id } = data as { ref: string; enrollment_id: string };

  // Receipt + joining message (best effort: a failed message never undoes a verified payment).
  try {
    const { data: e } = await c.from("enrollments").select("*").eq("id", enrollment_id).single();
    const s = await getSettings();
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abubakkaracademy.com";
    await Promise.all([
      sendConfirmation({
        ref, parent_name: e.parent_name, whatsapp: e.whatsapp, email: e.email, student: e.child_first_name,
        program: e.program_name ?? "Enrollment", classType: e.class_type ? CLASS_TYPE_LABEL[e.class_type as "group" | "private"] : "",
        packageLabel: e.package_label ?? "", amount: received, batch: "", joining: `${s.whatsapp_joining_text || ""}\nYour receipt: ${site}/confirmation/${ref}`,
      }),
      sendMetaPurchase({ ref, amount: e.amount_pkr, fbp: e.fbp, fbc: e.fbc, url: `${site}/confirmation/${ref}` }),
    ]);
  } catch { /* ignore */ }
  revalidatePath("/admin", "layout");
  back(ret, "msg", `Payment verified. ${ref} is now enrolled. Next: assign a class batch.`);
}

export async function rejectPayment(fd: FormData) {
  const admin = await requireAdmin();
  const ret = here(fd, "/admin/payments");
  const id = str(fd, "payment_id");
  if (!uuid(id)) back(ret, "err", "Payment not found.");
  const { error } = await db().rpc("reject_payment", { p_payment: id, p_admin: admin.email, p_note: str(fd, "note") });
  if (error) back(ret, "err", friendly(error));
  revalidatePath("/admin", "layout");
  back(ret, "msg", "Payment rejected. The parent can upload the correct receipt.");
}

export async function refundEnrollment(fd: FormData) {
  const admin = await requireAdmin();
  const ret = here(fd, "/admin/enrollments");
  const id = str(fd, "id");
  if (!uuid(id)) back(ret, "err", "Enrollment not found.");
  const { error } = await db().rpc("refund_enrollment", { p_enrollment: id, p_admin: admin.email, p_note: str(fd, "note") });
  if (error) back(ret, "err", friendly(error));
  revalidatePath("/admin", "layout");
  back(ret, "msg", "Marked as refunded and the class seat was released. Remember to send the money back to the parent.");
}

// ---------------------------------------------------------------------------------------------------- enrollments
export async function assignBatch(fd: FormData) {
  await requireAdmin();
  const ret = here(fd, "/admin/enrollments");
  const id = str(fd, "id"), batch = str(fd, "batch_id");
  if (!uuid(id) || (batch && !uuid(batch))) back(ret, "err", "Invalid selection.");
  const { error } = await db().rpc("assign_batch", { p_enrollment: id, p_batch: batch || null });
  if (error) back(ret, "err", friendly(error));
  revalidatePath("/admin", "layout");
  back(ret, "msg", batch ? "Student assigned to the class." : "Student removed from the class.");
}

/** Delete an enrollment that was never paid (test, abandoned or rejected). Paid ones are protected by the database. */
export async function deleteEnrollment(fd: FormData) {
  await requireAdmin();
  const ret = here(fd, "/admin/enrollments");
  const id = str(fd, "id");
  if (!uuid(id)) back(ret, "err", "Enrollment not found.");
  const c = db();
  const { data, error } = await c.rpc("delete_enrollment", { p_enrollment: id });
  if (error) back(ret, "err", friendly(error, "Could not delete this enrollment."));
  const r = data as { ref: string; receipts: string[] };
  if (r.receipts?.length) await c.storage.from("receipts").remove(r.receipts).catch(() => {});   // remove uploaded receipt files too
  revalidatePath("/admin", "layout");
  back(ret, "msg", `Enrollment ${r.ref} deleted.`);
}

export async function updateEnrollment(fd: FormData) {
  await requireAdmin();
  const ret = here(fd, "/admin/enrollments");
  const id = str(fd, "id"), ag = str(fd, "age_group_id");
  if (!uuid(id) || (ag && !uuid(ag))) back(ret, "err", "Invalid selection.");
  const patch: Record<string, unknown> = {
    admin_notes: str(fd, "admin_notes") || null, followed_up: fd.get("followed_up") === "on",
  };
  if (ag) patch.age_group_id = ag;
  const { error } = await db().from("enrollments").update(patch).eq("id", id);
  if (error) back(ret, "err", "Could not save.");
  revalidatePath("/admin", "layout");
  back(ret, "msg", "Saved.");
}

// ---------------------------------------------------------------------------------------------------- packages, programs, age groups, subjects
export async function updatePackage(fd: FormData) {
  await requireAdmin();
  const ret = here(fd, "/admin/packages");
  const id = str(fd, "id"), price = int(fd, "price_pkr");
  if (!uuid(id) || !Number.isFinite(price) || price < 0 || price > 5_000_000) back(ret, "err", "Enter a valid price.");
  const { error } = await db().from("packages").update({
    price_pkr: price, label: str(fd, "label") || "Package", schedule_note: str(fd, "schedule_note"), active: fd.get("active") === "on",
  }).eq("id", id);
  if (error) back(ret, "err", "Could not save the package.");
  revalidatePath("/", "layout");
  back(ret, "msg", `Package saved at ${formatPKR(price)}. Applies to NEW enrollments only; old enrollments keep the fee they paid.`);
}

export async function updateProgram(fd: FormData) {
  await requireAdmin();
  const ret = here(fd, "/admin/packages");
  const id = str(fd, "id"), status = str(fd, "status");
  if (!uuid(id) || !["open", "coming_soon", "closed"].includes(status)) back(ret, "err", "Invalid selection.");
  const { error } = await db().from("programs").update({ name: str(fd, "name") || "Program", description: str(fd, "description"), status }).eq("id", id);
  if (error) back(ret, "err", "Could not save the program.");
  revalidatePath("/", "layout");
  back(ret, "msg", "Program saved.");
}

export async function saveAgeGroup(fd: FormData) {
  await requireAdmin();
  const ret = here(fd, "/admin/packages");
  const id = str(fd, "id"), min = int(fd, "min_age"), max = int(fd, "max_age"), code = str(fd, "code").toUpperCase();
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 1 || max < min || max > 25) back(ret, "err", "Enter a valid age range.");
  const row = { label: str(fd, "label") || `Group ${code}`, min_age: min, max_age: max, focus: str(fd, "focus"), active: fd.get("active") === "on" };
  const c = db();
  const res = id && uuid(id)
    ? await c.from("age_groups").update(row).eq("id", id)
    : await c.from("age_groups").insert({ ...row, code: code || "X", sort: 99 });
  if (res.error) back(ret, "err", "Could not save the age group (is the code already used?).");
  revalidatePath("/", "layout");
  back(ret, "msg", "Age group saved.");
}

export async function saveSubject(fd: FormData) {
  await requireAdmin();
  const ret = here(fd, "/admin/packages");
  const id = str(fd, "id"), name = str(fd, "name");
  if (!name) back(ret, "err", "Enter a subject name.");
  const c = db();
  const res = id && uuid(id) ? await c.from("subjects").update({ name, active: fd.get("active") === "on" }).eq("id", id)
                             : await c.from("subjects").insert({ name, sort: 99 });
  if (res.error) back(ret, "err", "Could not save the subject (is the name already used?).");
  revalidatePath("/", "layout");
  back(ret, "msg", "Subject saved.");
}

// ---------------------------------------------------------------------------------------------------- class batches
export async function saveBatch(fd: FormData) {
  await requireAdmin();
  const ret = here(fd, "/admin/batches");
  const id = str(fd, "id"), program = str(fd, "program_id"), type = str(fd, "class_type"), ag = str(fd, "age_group_id");
  const cap = int(fd, "capacity");
  if (!uuid(program) || !Number.isFinite(cap) || cap < 0 || cap > 500 || !str(fd, "name")) back(ret, "err", "Enter a name, a program and a capacity.");
  const row = {
    name: str(fd, "name"), program_id: program, class_type: type === "group" || type === "private" ? type : null,
    age_group_id: ag && uuid(ag) ? ag : null, timing: str(fd, "timing"), start_date: str(fd, "start_date") || null,
    capacity: cap, teacher: str(fd, "teacher"), meeting_link: str(fd, "meeting_link"), active: fd.get("active") === "on" || !id,
  };
  const c = db();
  const res = id && uuid(id) ? await c.from("class_batches").update(row).eq("id", id) : await c.from("class_batches").insert(row);
  if (res.error) back(ret, "err", "Could not save the batch.");
  revalidatePath("/", "layout");
  back(ret, "msg", "Class batch saved.");
}

// ---------------------------------------------------------------------------------------------------- settings and admin users
const SETTING_KEYS = ["bank_details", "jazzcash_number", "easypaisa_number", "whatsapp_joining_text", "ad_spend_pkr",
  "hero_hook", "hero_sub", "promise_text", "limited_seats_threshold", "timing_options"];
export async function updateSettings(fd: FormData) {
  await requireAdmin();
  const { error } = await db().from("settings").upsert(SETTING_KEYS.filter((k) => fd.has(k)).map((key) => ({ key, value: String(fd.get(key) ?? "").trim() })));
  if (error) back("/admin/settings", "err", "Could not save the settings.");
  revalidatePath("/", "layout");
  back("/admin/settings", "msg", "Settings saved.");
}

export async function createAdmin(fd: FormData) {
  await requireAdmin();
  const email = str(fd, "email").toLowerCase(), pw = String(fd.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) back("/admin/settings", "err", "Enter a valid email address.");
  if (pw.length < 10) back("/admin/settings", "err", "Use a password of at least 10 characters.");
  const { error } = await db().from("admin_users").insert({ email, name: str(fd, "name"), password_hash: hashPassword(pw) });
  if (error) back("/admin/settings", "err", "Could not add the admin (is the email already used?).");
  back("/admin/settings", "msg", `Admin ${email} added.`);
}

export async function setAdminActive(fd: FormData) {
  const me = await requireAdmin();
  const id = str(fd, "id"), active = str(fd, "active") === "1";
  if (!uuid(id)) back("/admin/settings", "err", "Invalid admin.");
  if (id === me.id && !active) back("/admin/settings", "err", "You cannot deactivate your own account.");
  await db().from("admin_users").update({ active }).eq("id", id);
  back("/admin/settings", "msg", active ? "Admin re-activated." : "Admin deactivated and signed out.");
}

export async function changePassword(fd: FormData) {
  const me = await requireAdmin();
  const cur = String(fd.get("current") ?? ""), next = String(fd.get("next") ?? "");
  if (next.length < 10) back("/admin/settings", "err", "Use a new password of at least 10 characters.");
  const c = db();
  const { data: u } = await c.from("admin_users").select("password_hash").eq("id", me.id).single();
  if (!u || !verifyPassword(cur, u.password_hash)) back("/admin/settings", "err", "Your current password is not correct.");
  await c.from("admin_users").update({ password_hash: hashPassword(next) }).eq("id", me.id);
  back("/admin/settings", "msg", "Password changed.");
}
