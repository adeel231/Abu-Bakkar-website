import { NextResponse } from "next/server";
import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";

const schema = z.object({
  ref: z.string().regex(/^ABA-[A-Z0-9]{8}$/),
  payment_method: z.enum(["JazzCash", "Easypaisa", "Bank transfer"]),
  payment_txn_id: z.string().trim().min(4).max(60),
  payment_note: z.string().trim().max(120).optional(),
});

export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Please fill in the payment details." }, { status: 400 });
  const { ref, ...rest } = p.data;

  // Only enrollments still awaiting payment can be updated; verified ones are never touched here.
  const { data, error } = await db().from("enrollments")
    .update({ ...rest, status: "payment_submitted" })
    .eq("ref", ref).in("status", ["pending", "payment_started", "rejected"]).select("ref");
  if (error || !data?.length) return NextResponse.json({ error: "Enrollment not found or already submitted." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
