// Best-effort notifications. If credentials are absent, nothing is sent and the admin
// uses the WhatsApp click-to-chat buttons in the dashboard instead.
import { pkr } from "./db";

type Info = {
  ref: string; parent_name: string; whatsapp: string; email: string | null; child_first_name: string;
  program: string; amount: number; start: string; timings: string; joining: string;
};

export function confirmationText(i: Info) {
  return `Assalamu Alaikum ${i.parent_name},

Congratulations! ${i.child_first_name} is enrolled at Abu Bakkar Academy.

Enrollment ID: ${i.ref}
Program: ${i.program}
Amount received: ${pkr(i.amount)}
Starting date: ${i.start}
Schedule: ${i.timings}

${i.joining}

Sirf Taleem Nahi, Tarbiyat Bhi.`;
}

export async function sendConfirmation(i: Info) {
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
      body: JSON.stringify({
        from: process.env.RESEND_FROM, to: i.email,
        subject: `Enrollment confirmed — ${i.ref}`, text,
      }),
    }).catch(() => null));
  }
  await Promise.all(tasks);
}
