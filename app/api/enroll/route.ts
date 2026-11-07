import { NextResponse } from "next/server";
import { z } from "zod";
import { db, dbConfigured, newRef, normalisePk, seatsLeft, type Program } from "@/lib/db";

const schema = z.object({
  parent_name: z.string().trim().min(2).max(100),
  whatsapp: z.string().trim().max(30),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  child_first_name: z.string().trim().min(1).max(50),
  child_age: z.coerce.number().int().min(3).max(19),
  grade: z.string().trim().min(1).max(30),
  city: z.string().trim().min(2).max(60),
  program: z.string().max(80),
  preferred_schedule: z.string().trim().max(200).optional(),
  consent: z.literal(true),
  source: z.string().max(120).optional(),
  session_id: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the form and accept the consent box." }, { status: 400 });
  const d = parsed.data;

  const wa = normalisePk(d.whatsapp);
  if (!wa) return NextResponse.json({ error: "Enter a valid Pakistani WhatsApp number (e.g. 0300 1234567)." }, { status: 400 });

  const { data: prog } = await db().from("programs").select("*").eq("slug", d.program).single();
  const p = prog as Program | null;
  // Price always comes from the database, never from the client.
  if (!p || p.status !== "open" || p.price_pkr <= 0 || seatsLeft(p) <= 0)
    return NextResponse.json({ error: "This program is not open for enrollment." }, { status: 400 });

  const ref = newRef();
  const { error } = await db().from("enrollments").insert({
    ref, parent_name: d.parent_name, whatsapp: wa, email: d.email || null,
    child_first_name: d.child_first_name, child_age: d.child_age, grade: d.grade, city: d.city,
    program_id: p.id, preferred_schedule: d.preferred_schedule || null, amount_pkr: p.price_pkr,
    status: "pending", source: d.source || "direct", consent_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: "Could not save your enrollment. Please try again." }, { status: 500 });
  return NextResponse.json({ ref });
}
