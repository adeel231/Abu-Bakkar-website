import { db, getSettings } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { changePassword, createAdmin, setAdminActive, updateSettings } from "../../actions";
import { Flash, Section, when } from "../ui";

export const dynamic = "force-dynamic";

const GROUPS: { title: string; hint?: string; fields: [string, string, number][] }[] = [
  { title: "Payment instructions (shown to parents on the payment page)", fields: [
    ["jazzcash_number", "JazzCash account (number and account title)", 2], ["easypaisa_number", "Easypaisa account (number and account title)", 2],
    ["bank_details", "Bank transfer details (bank, account title, account number / IBAN)", 4]] },
  { title: "Messages", fields: [
    ["whatsapp_joining_text", "Joining instructions text (shown on the confirmation page and sent after verification)", 3],
    ["payment_alert_email", "Email addresses that get an alert when a receipt is uploaded (separate with commas). Empty means all admin users.", 1]] },
  { title: "Website content", fields: [
    ["hero_hook", "Homepage headline (the last word is shown in gold)", 1], ["hero_sub", "Homepage supporting lines (one per line)", 2],
    ["promise_text", "Parent Promise text", 2], ["timing_options", "Preferred-timing choices on the enrollment form (one per line)", 4]] },
  { title: "Advertising and capacity", fields: [
    ["ad_spend_pkr", "Total ad spend so far (PKR) — used for cost per paid student", 1],
    ["limited_seats_threshold", "Show “Limited seats” when this many seats or fewer are left in a batch", 1]] },
];

export default async function Settings({ searchParams }: { searchParams: { msg?: string; err?: string } }) {
  const me = await requireAdmin();
  const [s, au] = await Promise.all([getSettings(), db().from("admin_users").select("id,email,name,active,last_login").order("created_at")]);
  return (
    <>
      <Flash sp={searchParams} />
      <form action={updateSettings} className="space-y-6">
        {GROUPS.map((g) => (
          <Section key={g.title} title={g.title}>
            <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm md:max-w-3xl">
              {g.fields.map(([k, l, rows]) => (
                <div key={k}><label className="label" htmlFor={k}>{l}</label><textarea id={k} name={k} defaultValue={s[k] ?? ""} rows={rows} className="input !py-2" /></div>
              ))}
            </div>
          </Section>
        ))}
        <button className="btn-emerald">Save settings</button>
      </form>

      <Section title="Admin users">
        <div className="space-y-2 md:max-w-3xl">
          {((au.data ?? []) as any[]).map((a) => (
            <form key={a.id} action={setAdminActive} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-3 shadow-sm">
              <input type="hidden" name="id" value={a.id} /><input type="hidden" name="active" value={a.active ? "0" : "1"} />
              <p className="text-sm"><b>{a.email}</b>{a.name ? ` · ${a.name}` : ""}{a.id === me.id ? " (you)" : ""} · last login {when(a.last_login)}{a.active ? "" : " · INACTIVE"}</p>
              {a.id !== me.id && <button className="btn border border-slate-300 !py-1.5 text-sm text-navy">{a.active ? "Deactivate" : "Re-activate"}</button>}
            </form>
          ))}
        </div>
        <form action={createAdmin} className="mt-3 grid gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-4 md:max-w-3xl md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <div><label className="label">Email</label><input name="email" type="email" required className="input !py-2" /></div>
          <div><label className="label">Name</label><input name="name" className="input !py-2" /></div>
          <div><label className="label">Password (10+ characters)</label><input name="password" type="password" minLength={10} required autoComplete="new-password" className="input !py-2" /></div>
          <button className="btn-emerald !py-2">Add admin</button>
        </form>
        <form action={changePassword} className="mt-3 grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:max-w-3xl md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div><label className="label">Your current password</label><input name="current" type="password" required autoComplete="current-password" className="input !py-2" /></div>
          <div><label className="label">New password (10+ characters)</label><input name="next" type="password" minLength={10} required autoComplete="new-password" className="input !py-2" /></div>
          <button className="btn border border-slate-300 !py-2 text-navy">Change my password</button>
        </form>
      </Section>
    </>
  );
}
