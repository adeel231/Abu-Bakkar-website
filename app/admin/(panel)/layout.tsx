import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Abu Bakkar Academy", robots: { index: false } };

const NAV = [
  ["/admin", "Overview"], ["/admin/payments", "Payments"], ["/admin/enrollments", "Enrollments"], ["/admin/people", "Parents & Students"],
  ["/admin/batches", "Class Batches"], ["/admin/packages", "Packages & Pricing"], ["/admin/settings", "Settings"],
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="font-bold text-navy">Abu Bakkar Academy — Admin</p>
          <form action={logout} className="flex items-center gap-3 text-sm text-slate-600">
            <span className="hidden sm:inline">{admin.email}</span>
            <button className="btn border border-slate-300 !px-4 !py-1.5 text-sm text-navy">Log out</button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map(([h, l]) => <Link key={h} href={h} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-navy hover:bg-emerald-50">{l}</Link>)}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">{children}</main>
    </div>
  );
}
