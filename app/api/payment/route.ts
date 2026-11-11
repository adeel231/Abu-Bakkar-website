import { NextResponse } from "next/server";
import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { errorCode, friendly } from "@/lib/errors";

const schema = z.object({
  ref: z.string().regex(/^ABA-[A-Z0-9]{8}$/),
  payment_method: z.enum(["JazzCash", "Easypaisa", "Bank transfer"]),
  payment_txn_id: z.string().trim().max(60).optional().default(""),
  payment_note: z.string().trim().max(120).optional(),
});

const BUCKET = "receipts";
const MAX_BYTES = 5 * 1024 * 1024;
// Only real images / PDFs are accepted: checked by the file's first bytes, not just its name.
const KINDS: { ext: string; type: string; test: (b: Uint8Array) => boolean }[] = [
  { ext: "jpg", type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", type: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { ext: "webp", type: "image/webp", test: (b) => b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45 },
  { ext: "pdf", type: "application/pdf", test: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
  { ext: "heic", type: "image/heic", test: (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 },   // iPhone photos
];

/** Parent says "I have paid" and uploads the receipt (transaction ID optional). This only QUEUES the payment for an
 *  admin to check against the real bank/wallet statement. It never confirms the enrollment. */
export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Please fill in the form again." }, { status: 400 });

  const p = schema.safeParse({
    ref: form.get("ref"), payment_method: form.get("payment_method"),
    payment_txn_id: form.get("payment_txn_id") ?? "", payment_note: form.get("payment_note") ?? undefined,
  });
  if (!p.success) return NextResponse.json({ error: "Please choose the payment method you used." }, { status: 400 });

  const file = form.get("receipt");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Please upload a photo or screenshot of your payment receipt." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "The receipt is too large. Please upload a file under 5 MB." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = KINDS.find((k) => k.test(bytes));
  if (!kind) return NextResponse.json({ error: "Please upload the receipt as a photo (JPG, PNG) or PDF." }, { status: 400 });

  const c = db();
  const path = `${p.data.ref}/${Date.now()}.${kind.ext}`;
  const up = await c.storage.from(BUCKET).upload(path, bytes, { contentType: kind.type, upsert: false });
  if (up.error) return NextResponse.json({ error: "Could not upload the receipt. Please try again." }, { status: 500 });

  const { error } = await c.rpc("submit_payment", {
    p_ref: p.data.ref, p_method: p.data.payment_method, p_txn: p.data.payment_txn_id, p_note: p.data.payment_note ?? "", p_receipt: path,
  });
  if (error) {
    await c.storage.from(BUCKET).remove([path]).catch(() => {});   // don't keep files for submissions that failed
    return NextResponse.json({ error: friendly(error, "Could not submit. Please try again.") }, { status: errorCode(error) ? 400 : 500 });
  }
  return NextResponse.json({ ok: true });
}
