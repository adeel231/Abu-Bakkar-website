import { NextResponse } from "next/server";
import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { errorCode, friendly } from "@/lib/errors";

const schema = z.object({
  ref: z.string().regex(/^ABA-[A-Z0-9]{8}$/),
  payment_method: z.enum(["JazzCash", "Easypaisa", "Bank transfer"]),
  payment_txn_id: z.string().trim().min(4).max(60),
  payment_note: z.string().trim().max(120).optional(),
});

/** Parent says "I have paid" and gives the transaction reference. This only QUEUES the payment for an admin to check
 *  against the real bank/wallet statement. It never confirms the enrollment. */
export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Please enter the payment method and the full transaction ID." }, { status: 400 });
  const { error } = await db().rpc("submit_payment", {
    p_ref: p.data.ref, p_method: p.data.payment_method, p_txn: p.data.payment_txn_id, p_note: p.data.payment_note ?? "",
  });
  if (error) return NextResponse.json({ error: friendly(error, "Could not submit. Please try again.") }, { status: errorCode(error) ? 400 : 500 });
  return NextResponse.json({ ok: true });
}
