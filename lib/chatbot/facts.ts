// Facts the chatbot must always get right. They are read from the live catalog and settings on every request,
// so a price changed in Admin is changed in the chatbot too. Written without commas, like the website copy.
import type { Catalog } from "@/lib/db";
import { WHATSAPP, WHATSAPP_PRETTY } from "@/lib/contact";
import { isConfigured, monthlyPackage, perMonth, plan, savings } from "@/lib/pricing";

/** Local format of the academy number: 923335767202 becomes 03335767202. */
export const localPhone = (intl: string) => (intl.startsWith("92") ? "0" + intl.slice(2) : intl);
export const ADMISSION_PHONE = localPhone(WHATSAPP);

/** Used only when no payment details are filled in under Admin → Settings. Override with CHAT_PAYMENT_NUMBER. */
export const PAYMENT_NUMBER_FALLBACK = (process.env.CHAT_PAYMENT_NUMBER || "03335760892").trim();

const rs = (n: number) => `Rs. ${Math.round(n)}`;                       // no thousands separator, as in the website copy
const DEFAULT_TIMINGS = "Morning (9 AM – 12 PM)\nAfternoon (12 PM – 4 PM)\nEvening (4 PM – 8 PM)\nNight (8 PM – 10 PM)";

export type LiveFacts = { text: string; allowedNumbers: string[] };

const MOBILE = /(?:\+?92|0)[\s-]?3\d{2}[\s-]?\d{7}/g;     // Pakistani mobile numbers in any common spacing
const LONG_RUN = /\d{9,}/g;                                 // account numbers and other long digit runs
const national = (d: string) => (d.startsWith("92") && d.length === 12 ? "0" + d.slice(2) : d);

/** Every phone or account-like number in a text, in national form (0333...). Prices and ages never match. */
export function phoneDigits(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.match(MOBILE) ?? []) out.add(national(m.replace(/\D/g, "")));
  for (const m of text.match(LONG_RUN) ?? []) out.add(national(m));
  return Array.from(out);
}

export function buildLiveFacts(c: Catalog, s: Record<string, string>): LiveFacts {
  const lines: string[] = [];
  const allowed = new Set<string>([ADMISSION_PHONE, ...phoneDigits(WHATSAPP_PRETTY)]);

  lines.push(`Admission phone and WhatsApp: ${ADMISSION_PHONE} (international ${WHATSAPP_PRETTY}). WhatsApp link: https://wa.me/${WHATSAPP}`);

  const cg = c.programs.find((p) => p.kind === "character");
  if (cg) {
    const g = plan(c.packages, cg.id, "group");
    const monthly = monthlyPackage(c.packages, cg.id, "group");
    lines.push("");
    lines.push("CHARACTER GROOMING (live online classes). Only Online Group classes are offered.");
    lines.push("It is offered as Children Grooming (boys and girls aged 5 to 15) and as Parent Grooming (for mothers and fathers). Both have the same plans and prices. The 3 month plan is the Basic Course and the 6 month plan is the Advanced Course.");
    for (const p of g) {
      const sv = monthly ? savings(p, monthly) : 0;
      lines.push(`- ${p.label}: ${rs(p.price_pkr)}${p.months > 1 ? ` (${rs(perMonth(p))} per month${sv > 0 ? ` and you save ${rs(sv)}` : ""})` : " per month"}. ${p.schedule_note}`.trim());
    }
    lines.push("Private one-on-one classes are NOT offered.");
  }

  const at = c.programs.find((p) => p.kind === "tuition");
  if (at) {
    const t = plan(c.packages, at.id, "group")[0];
    if (t) lines.push(`ACADEMIC TUITION (separate service): ${rs(t.price_pkr)} per month${t.sessions ? ` with ${t.sessions} live online group sessions` : ""}. The parent chooses All subjects or Compulsory subjects and the price is the same.`);
  }

  if (c.ageGroups.length) {
    lines.push("");
    lines.push("AGE GROUPS:");
    for (const a of c.ageGroups) lines.push(`- ${a.label}: ages ${a.min_age} to ${a.max_age}. Focus: ${a.focus}`);
    lines.push("Ages that fit two groups: the parent picks one and the team confirms the best placement.");
  }

  lines.push("");
  lines.push("PREFERRED CLASS TIMES (the parent picks one on the enrollment form and the team confirms the exact time after payment is verified):");
  for (const t of (s.timing_options || DEFAULT_TIMINGS).split("\n").map((x) => x.trim()).filter(Boolean)) lines.push(`- ${t}`);

  lines.push("");
  lines.push("PAYMENT:");
  const methods: string[] = [];
  if (isConfigured(s.jazzcash_number)) methods.push(`JazzCash: ${s.jazzcash_number.trim()}`);
  if (isConfigured(s.easypaisa_number)) methods.push(`Easypaisa: ${s.easypaisa_number.trim()}`);
  if (isConfigured(s.bank_details)) methods.push(`Bank transfer: ${s.bank_details.trim()}`);
  if (methods.length) {
    for (const m of methods) { lines.push(`- ${m}`); phoneDigits(m).forEach((d) => allowed.add(d)); }
  } else {
    lines.push(`- Payment number: ${PAYMENT_NUMBER_FALLBACK} (the parent can pay from JazzCash or Easypaisa or a bank app)`);
    allowed.add(PAYMENT_NUMBER_FALLBACK);
  }
  lines.push("- Copy these payment details exactly. Never change or invent a number. After paying the parent uploads the receipt on the payment page.");

  return { text: lines.join("\n"), allowedNumbers: Array.from(allowed) };
}
