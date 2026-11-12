// Best-effort notifications. If credentials are absent nothing is sent, and the admin uses the
// WhatsApp click-to-chat button in the dashboard instead. Failures never block a payment approval.
import nodemailer from "nodemailer";
import { formatPKR } from "./pricing";
import { META_PIXEL_ID } from "./contact";

const resendUrl = () => `${process.env.RESEND_API_URL || "https://api.resend.com"}/emails`;
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] as string));

/** True when some way of sending email is set up (Gmail SMTP or Resend). */
export const emailConfigured = () => !!((process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL) || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) || (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) || (process.env.RESEND_API_KEY && process.env.RESEND_FROM));

/** Sends one email. Uses Brevo (HTTPS API, same as Abundant Visas) when BREVO_API_KEY and BREVO_SENDER_EMAIL are set, else your own mailbox over SMTP (SMTP_HOST / SMTP_USER / SMTP_PASS, for example GoDaddy) else Gmail SMTP when GMAIL_USER and GMAIL_APP_PASSWORD are set (simple: a Gmail "App Password"), otherwise Resend. Never throws. */
export async function sendMail(o: { to: string | string[]; subject: string; text: string; html?: string }): Promise<boolean> {
  try {
    if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": process.env.BREVO_API_KEY, accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({
          sender: { name: process.env.BREVO_SENDER_NAME || "Abu Bakkar Academy", email: process.env.BREVO_SENDER_EMAIL },
          to: (Array.isArray(o.to) ? o.to : [o.to]).map((email) => ({ email })),
          replyTo: process.env.BREVO_REPLY_TO ? { email: process.env.BREVO_REPLY_TO } : undefined,
          subject: o.subject, textContent: o.text, htmlContent: o.html,
        }),
        signal: AbortSignal.timeout(15_000),
      }).catch(() => null);
      if (!res?.ok) console.error("[mail] Brevo did not accept the email:", res?.status ?? "no response");
      return !!res?.ok;
    }
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const port = Number(process.env.SMTP_PORT) || 465;
      const t = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port, secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
      });
      await t.sendMail({ from: `"${process.env.SMTP_FROM_NAME || "Abu Bakkar Academy"}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`, to: o.to, subject: o.subject, text: o.text, html: o.html });
      return true;
    }
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const t = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, "") } });
      await t.sendMail({ from: `"Abu Bakkar Academy" <${process.env.GMAIL_USER}>`, to: o.to, subject: o.subject, text: o.text, html: o.html });
      return true;
    }
    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
      const res = await fetch(resendUrl(), {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.RESEND_FROM, to: o.to, subject: o.subject, text: o.text, html: o.html }),
      }).catch(() => null);
      return !!res?.ok;
    }
  } catch (e) { console.error("[mail] could not send:", e instanceof Error ? e.message : "unknown"); }
  return false;
}

export type ReceiptInfo = {
  ref: string; parent_name: string; whatsapp: string; email: string | null; student: string;
  program: string; classType: string; packageLabel: string; amount: number; batch: string; joining: string;
};

export function confirmationText(i: ReceiptInfo) {
  return `Assalamu Alaikum ${i.parent_name},

Congratulations! ${i.student} is enrolled at Abu Bakkar Academy.

RECEIPT
Enrollment ID: ${i.ref}
Program: ${i.program}
Class type: ${i.classType}
Package: ${i.packageLabel}
Amount received: ${formatPKR(i.amount)}
${i.batch ? `Class: ${i.batch}\n` : ""}
${i.joining}

Sirf Taleem Nahi, Tarbiyat Bhi.`;
}

export async function sendConfirmation(i: ReceiptInfo) {
  const text = confirmationText(i);
  const tasks: Promise<unknown>[] = [];

  if (process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_ID) {
    // Free-form text only delivers inside the 24h window; for production configure an approved template.
    tasks.push(fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: i.whatsapp, type: "text", text: { body: text } }),
    }).catch(() => null));
  }
  if (i.email && emailConfigured()) tasks.push(sendMail({ to: i.email, subject: `Enrollment confirmed — ${i.ref}`, text }));
  await Promise.all(tasks);
}

/** Optional server-side Meta Conversions API "Purchase". Runs only after an admin verified the payment.
 *  Sends value, currency and the parent's browser ids (fbp/fbc) — never names, phone, email or child data. */
export async function sendMetaPurchase(o: { ref: string; amount: number; fbp?: string | null; fbc?: string | null; url: string }) {
  const pixel = META_PIXEL_ID, token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token || (!o.fbp && !o.fbc)) return;      // no browser identifier captured -> nothing to match, don't send
  await fetch(`https://graph.facebook.com/v20.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [{
      event_name: "Purchase", event_time: Math.floor(Date.now() / 1000), event_id: o.ref, action_source: "website",
      event_source_url: o.url, user_data: { fbp: o.fbp || undefined, fbc: o.fbc || undefined },
      custom_data: { value: o.amount, currency: "PKR" },
    }] }),
  }).catch(() => null);
}

// ---------------------------------------------------------------------------------------------------- admin alert: receipt uploaded
export type PaymentAlert = {
  ref: string; parent_name: string; whatsapp: string; student: string; program: string; classType: string; packageLabel: string;
  amount: number; method: string; txn: string; adminUrl: string;
};

/** Who gets the "receipt uploaded" email: the addresses typed in Admin → Settings, otherwise every active admin account,
 *  otherwise the ADMIN_EMAIL from the server settings. */
export function alertRecipients(setting: string | undefined, adminEmails: string[], fallback = process.env.ADMIN_EMAIL): string[] {
  const ok = (e: string) => /^\S+@\S+\.\S+$/.test(e);
  const typed = (setting || "").split(/[,;\n]+/).map((x) => x.trim()).filter(ok);
  if (typed.length) return Array.from(new Set(typed));
  const admins = adminEmails.map((x) => x.trim()).filter(ok);
  if (admins.length) return Array.from(new Set(admins));
  return fallback && ok(fallback.trim()) ? [fallback.trim()] : [];
}

/** Emails the admin(s) that a parent uploaded a receipt and it is waiting for approval. Returns false if nothing was sent. */
export async function sendPaymentAlert(to: string[], i: PaymentAlert): Promise<boolean> {
  if (!emailConfigured() || !to.length) return false;
  const rows: [string, string][] = [
    ["Enrollment", i.ref], ["Parent", `${i.parent_name} (WhatsApp ${i.whatsapp})`], ["Student", i.student],
    ["Package", [i.program, i.classType, i.packageLabel].filter(Boolean).join(" · ")], ["Amount to receive", formatPKR(i.amount)],
    ["Paid by", i.method], ["Transaction ID", i.txn || "not given"],
  ];
  const text = `A parent has uploaded a payment receipt. It is waiting for your approval.

${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}

Open the receipt, check your JazzCash / Easypaisa / bank statement, and approve only if the money is really there:
${i.adminUrl}`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#0b1f3a">
<h2 style="margin:0 0 6px">Receipt uploaded</h2>
<p style="margin:0 0 16px;color:#475569">A parent has uploaded a payment receipt. It is waiting for your approval.</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;color:#64748b;width:38%">${esc(k)}</td><td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-weight:600">${esc(v)}</td></tr>`).join("")}</table>
<p style="margin:20px 0"><a href="${esc(i.adminUrl)}" style="background:#d4a017;color:#0b1f3a;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;display:inline-block">Review and approve</a></p>
<p style="font-size:12px;color:#64748b;margin:0">Check your statement first. A receipt image alone can be edited.</p></div>`;
  return sendMail({ to, subject: `Receipt uploaded: ${i.ref} (${formatPKR(i.amount)})`, text, html });
}
