"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, getSettings } from "@/lib/db";
import { friendly } from "@/lib/errors";
import { CLASS_TYPE_LABEL } from "@/lib/pricing";
import { sendConfirmation, sendMetaPurchase } from "@/lib/notify";
import { checkReview } from "@/lib/reviewLink";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Approve or reject a payment from the link in the email. The signed link is checked again here, so the form cannot be forged. */
export async function decidePayment(fd: FormData) {
  const q = { p: str(fd, "p"), a: str(fd, "a"), e: str(fd, "e"), u: str(fd, "u"), s: str(fd, "s") };
  const back = (extra: Record<string, string>) => redirect(`/payment-review?${new URLSearchParams({ ...q, ...extra }).toString()}`);
  const v = checkReview(q);
  if (!v.ok) return back({ err: "This link is not valid or has expired. Please use the admin panel." });
  const c = db();

  if (v.a === "reject") {
    const { error } = await c.rpc("reject_payment", { p_payment: v.p, p_admin: v.email, p_note: str(fd, "note").slice(0, 300) });
    if (error) return back({ err: friendly(error) });
    revalidatePath("/admin", "layout");
    return back({ done: "rejected" });
  }

  // Approve: only after the admin ticks that the money is really in the account. The amount received is the amount expected.
  if (fd.get("confirm") !== "yes") return back({ err: "Please tick the box to confirm that you checked your account and the money is received." });
  const { data: pay } = await c.from("payments").select("amount_pkr").eq("id", v.p).maybeSingle();
  if (!pay) return back({ err: "Payment not found." });
  const received = (pay as { amount_pkr: number }).amount_pkr;
  const { data, error } = await c.rpc("verify_payment", { p_payment: v.p, p_admin: v.email, p_received: received });
  if (error) return back({ err: friendly(error) });
  const { ref, enrollment_id } = data as { ref: string; enrollment_id: string };

  // Same follow-up as approving in the admin panel (best effort: a failed message never undoes a verified payment).
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
  return back({ done: "approved" });
}
