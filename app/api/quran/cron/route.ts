import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/db";
import { alertRecipients, sendMail } from "@/lib/notify";

export const dynamic = "force-dynamic";
const HOUR = 36e5;

/** Run daily (see vercel.json). Sends parents a reminder for trials in the next 24h, and the admin a digest of
 *  inquiries unanswered for 24h+ and trials that passed without being marked attended. Protected by CRON_SECRET. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "No database" }, { status: 503 });

  const c = db(), now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();

  const due = (await c.from("quran_leads").select("id,parent_name,email,student_name,trial_at,time_zone")
    .eq("status", "trial_booked").is("reminded_at", null).gt("trial_at", iso(now)).lte("trial_at", iso(now + 24 * HOUR))).data ?? [];
  let reminded = 0;
  for (const l of due as { id: string; parent_name: string; email: string; student_name: string; trial_at: string; time_zone: string }[]) {
    let when = l.trial_at;
    try { when = new Date(l.trial_at).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: l.time_zone }) + ` (${l.time_zone})`; } catch {}
    const ok = await sendMail({ to: l.email, subject: `Reminder: ${l.student_name}'s free Quran assessment`, text: `Assalamu Alaikum ${l.parent_name},\n\nA reminder that ${l.student_name}'s free Quran assessment with Abu Bakkar Academy is on ${when}.\n\nPlease make sure a parent or guardian is nearby and the device has a camera and a stable connection. If you need to change the time, reply to this email or message us on WhatsApp.\n\nAbu Bakkar Academy` });
    if (ok) { await c.from("quran_leads").update({ reminded_at: new Date().toISOString() }).eq("id", l.id); reminded++; }
  }

  const unanswered = (await c.from("quran_leads").select("parent_name,student_name,country,created_at").eq("status", "new_inquiry").lt("created_at", iso(now - 24 * HOUR))).data ?? [];
  const missed = (await c.from("quran_leads").select("parent_name,student_name,trial_at").eq("status", "trial_booked").lt("trial_at", iso(now - HOUR))).data ?? [];
  let alerted = false;
  if (unanswered.length || missed.length) {
    const adm = await c.from("admin_users").select("email").eq("active", true);
    const st = await c.from("settings").select("value").eq("key", "payment_alert_email").maybeSingle();
    const to = alertRecipients(st.data?.value, ((adm.data ?? []) as { email: string }[]).map((a) => a.email));
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abubakkaracademy.com";
    if (to.length) alerted = await sendMail({ to, subject: `Quran leads need attention (${unanswered.length} unanswered, ${missed.length} missed)`, text: `Unanswered for over 24 hours: ${unanswered.length}\n${(unanswered as { parent_name: string; student_name: string; country: string }[]).map((x) => `- ${x.parent_name} / ${x.student_name} (${x.country})`).join("\n")}\n\nTrials past their time and not marked attended: ${missed.length}\n${(missed as { parent_name: string; student_name: string }[]).map((x) => `- ${x.parent_name} / ${x.student_name}`).join("\n")}\n\n${site}/admin/quran-leads` });
  }
  return NextResponse.json({ reminded, unanswered: unanswered.length, missed: missed.length, alerted });
}
