import { NextResponse } from "next/server";
import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";

const schema = z.object({
  session_id: z.string().max(64),
  name: z.enum(["ad_click", "landing_view", "enroll_click", "form_view", "payment_started", "payment_verified",
    "share_whatsapp", "share_facebook", "promise_support", "referral_visit"]),
  source: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success || !dbConfigured()) return NextResponse.json({ ok: false }, { status: 400 });
  await db().from("events").insert(p.data);
  return NextResponse.json({ ok: true });
}
