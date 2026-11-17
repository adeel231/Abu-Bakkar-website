import { NextResponse } from "next/server";
import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { alertRecipients, sendMail } from "@/lib/notify";
import { AGE_BANDS, LEVELS, TEACHER_PREFS } from "@/lib/quran";

const t = (min: number, max: number) => z.string().trim().min(min).max(max);
const schema = z.object({
  parent_name: t(2, 100), email: t(5, 120).email(),
  whatsapp: t(8, 25).regex(/^\+[\d\s()-]{7,22}$/, "WhatsApp must start with + and the country code"),
  country: t(2, 60), time_zone: t(2, 60),
  student_name: t(1, 50), age_band: z.enum(AGE_BANDS as [string, ...string[]]), level: z.enum(LEVELS as [string, ...string[]]),
  teacher_pref: z.enum(TEACHER_PREFS as [string, ...string[]]).default("No preference"),
  preferred_time: t(2, 200),
  consent: z.literal(true),
  landing_page: z.string().trim().max(200).optional(), source: z.string().trim().max(120).optional(),
  utm: z.record(z.any()).optional(),
  website: z.string().max(0).optional(),   // honeypot
});

const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now(), l = (hits.get(ip) || []).filter((x) => now - x < 3600e3); l.push(now); hits.set(ip, l);
  return l.length > (Number(process.env.ENROLL_RATE_LIMIT) || 10);
};
const esc = (v: string) => v.replace(/[\r\n]+/g, " ");

export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: "Booking is temporarily unavailable. Please message us on WhatsApp." }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (limited(ip)) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) {
    const consent = p.error.issues.some((i) => i.path[0] === "consent");
    const wa = p.error.issues.find((i) => i.path[0] === "whatsapp");
    return NextResponse.json({ error: consent ? "Please tick the parent consent box." : wa ? wa.message : "Please check the form and fill in every required field." }, { status: 400 });
  }
  const d = p.data;
  if (d.website) return NextResponse.json({ error: "Could not submit." }, { status: 400 });
  const { website, consent, ...rest } = d; void website; void consent;

  const { data, error } = await db().from("quran_leads").insert({ ...rest, consent_at: new Date().toISOString() }).select("id").single();
  if (error) { console.error("[quran lead]", error.code); return NextResponse.json({ error: "We could not save your booking. Please try again or message us on WhatsApp." }, { status: 500 }); }

  // Best-effort emails: never fail the booking if mail is down.
  try {
    const adm = await db().from("admin_users").select("email").eq("active", true);
    const st = await db().from("settings").select("value").eq("key", "payment_alert_email").maybeSingle();
    const to = alertRecipients(st.data?.value, ((adm.data ?? []) as { email: string }[]).map((a) => a.email));
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abubakkaracademy.com";
    if (to.length) await sendMail({ to, subject: `New Quran assessment request: ${esc(d.student_name)} (${esc(d.country)})`, text: `New Quran assessment request.\n\nParent: ${esc(d.parent_name)}\nWhatsApp: ${esc(d.whatsapp)}\nEmail: ${esc(d.email)}\nCountry / zone: ${esc(d.country)} / ${esc(d.time_zone)}\nStudent: ${esc(d.student_name)} (${d.age_band}), ${d.level}\nTeacher: ${d.teacher_pref}\nPreferred time: ${esc(d.preferred_time)}\nSource: ${esc(d.source || "direct")}, landing ${esc(d.landing_page || "")}\n\nRespond within one working day: ${site}/admin/quran-leads` });
    await sendMail({ to: d.email, subject: "We received your free Quran assessment request", text: `Assalamu Alaikum ${esc(d.parent_name)},\n\nThank you for requesting a free Quran assessment for ${esc(d.student_name)} at Abu Bakkar Academy.\n\nWhat happens next:\n1. We will message you on WhatsApp to confirm a teacher and a time (usually within one working day).\n2. You will get a reminder before the session.\n3. After the assessment you receive a recommended level and plan. No payment is needed to book the assessment.\n\nYour preferred time: ${esc(d.preferred_time)} (${esc(d.time_zone)}).\n\nAbu Bakkar Academy` });
  } catch (e) { console.error("[quran lead mail]", e instanceof Error ? e.message : "unknown"); }

  return NextResponse.json({ ok: true, id: data?.id });
}
