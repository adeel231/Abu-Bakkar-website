import { NextResponse } from "next/server";
import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";

const schema = z.object({
  session_id: z.string().max(64),
  name: z.enum(["ad_click", "landing_view", "enroll_click", "form_view", "form_start", "payment_started",
    "share_whatsapp", "share_facebook", "share_copy", "share_native", "promise_support", "referral_visit"]),
  source: z.string().max(120).optional(),
  section: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),   // which homepage section was shared / brought the visit
  rf: z.string().regex(/^[a-z0-9]{1,12}$/i).optional(),        // the sharer's anonymous code (one per browser, no personal data)
});

export async function POST(req: Request) {
  // "payment_verified" is deliberately NOT accepted from browsers: only the server records it, when an admin verifies a payment.
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success || !dbConfigured()) return NextResponse.json({ ok: false }, { status: 400 });
  const c = db();
  const { error } = await c.from("events").insert(p.data);
  // Before the latest database update the section/rf columns do not exist: still record the event itself.
  if (error && (p.data.section || p.data.rf)) { const { section, rf, ...plain } = p.data; void section; void rf; await c.from("events").insert(plain); }
  return NextResponse.json({ ok: true });
}
