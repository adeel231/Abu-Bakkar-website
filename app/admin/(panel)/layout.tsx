import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db, dbConfigured } from "@/lib/db";
import { logout } from "../actions";
import AdminNav from "./AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Abu Bakkar Academy", robots: { index: false } };

async function pendingPayments() {
  if (!dbConfigured()) return 0;
  try {
    const { count } = await db().from("payments").select("id", { count: "exact", head: true }).eq("status", "submitted");
    return count ?? 0;
  } catch { return 0; }
}

const Brand = () => (
  <div className="flex items-center gap-3">
    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
      {/* the logo mark only (left part of the compact logo) */}
      <span className="h-full w-full bg-no-repeat" style={{ backgroundImage: "url(/logo-compact.png)", backgroundSize: "auto 100%", backgroundPosition: "left center" }} aria-hidden />
    </span>
    <div className="leading-tight">
      <p className="font-serif text-base font-bold text-white">Abu Bakkar</p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Admin</p>
    </div>
  </div>
);

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [admin, pending] = await Promise.all([requireAdmin(), pendingPayments()]);
  const initial = (admin.email || "?").charAt(0).toUpperCase();

  const SignOut = ({ compact }: { compact?: boolean }) => (
    <form action={logout}>
      <button className={`flex items-center gap-2 rounded-lg text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white ${compact ? "p-2" : "w-full px-3 py-2"}`} aria-label="Log out">
        <LogOut size={16} />{!compact && "Log out"}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f4]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-gradient-to-b from-[#052a1f] to-[#0a3f2d] lg:flex">
        <div className="px-6 py-6"><Brand /></div>
        <div className="flex-1 overflow-y-auto py-2"><AdminNav pending={pending} variant="side" /></div>
        <div className="m-3 rounded-2xl bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold font-bold text-navy">{initial}</span>
            <p className="min-w-0 truncate text-sm text-white/85" title={admin.email}>{admin.email}</p>
          </div>
          <div className="mt-2"><SignOut /></div>
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-30 bg-gradient-to-b from-[#052a1f] to-[#0a3f2d] lg:hidden">
        <div className="flex items-center justify-between px-4 py-3"><Brand /><SignOut compact /></div>
        <AdminNav pending={pending} variant="top" />
      </header>

      <main className="admin-main lg:pl-64">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
