// Best-effort notifications. If credentials are absent nothing is sent, and the admin uses the
// WhatsApp click-to-chat button in the dashboard instead. Failures never block a payment approval.
import { formatPKR } from "./pricing";
import { META_PIXEL_ID } from "./contact";

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
  if (process.env.RESEND_API_KEY && i.email) {
    tasks.push(fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.RESEND_FROM, to: i.email, subject: `Enrollment confirmed — ${i.ref}`, text }),
    }).catch(() => null));
  }
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
