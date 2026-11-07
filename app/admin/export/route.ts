import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// A cell that starts with = + - @ can run as a formula in Excel / Sheets; prefix it so exported data is always inert text.
const cell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const status = new URL(req.url).searchParams.get("status") || "all";
  const c = db();
  let q = c.from("enrollments").select("*").order("created_at", { ascending: false }).limit(20000);
  if (status !== "all") q = q.eq("status", status);
  const [er, pr, ag, bt] = await Promise.all([q, c.from("payments").select("*"), c.from("age_groups").select("id,label"), c.from("class_batches").select("id,name")]);
  const pay = new Map<string, any>();
  for (const p of ((pr.data ?? []) as any[]).sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))) pay.set(p.enrollment_id, p);
  const groups = new Map(((ag.data ?? []) as any[]).map((g) => [g.id, g.label]));
  const batches = new Map(((bt.data ?? []) as any[]).map((b) => [b.id, b.name]));

  const head = ["Enrollment ID", "Created", "Status", "Parent", "WhatsApp", "Email", "City", "Student", "Age", "School grade", "Service", "Class type", "Package",
    "Subject", "Age group", "Class batch", "Preferred timing", "Amount charged (PKR)", "Payment method", "Transaction ID", "Amount received (PKR)", "Verified at",
    "Source", "UTM campaign", "UTM medium", "Notes"];
  const lines = [head.map(cell).join(",")];
  for (const e of (er.data ?? []) as any[]) {
    const p = pay.get(e.id);
    lines.push([e.ref, e.created_at, e.status, e.parent_name, e.whatsapp, e.email, e.city, e.child_first_name, e.child_age, e.grade, e.program_name, e.class_type, e.package_label,
      e.subject_name, groups.get(e.age_group_id), batches.get(e.class_batch_id), e.preferred_schedule, e.amount_pkr, p?.method, p?.txn_ref, p?.amount_received, e.verified_at,
      e.source, e.utm?.campaign, e.utm?.medium, e.admin_notes].map(cell).join(","));
  }
  return new Response("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="enrollments-${status}-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
