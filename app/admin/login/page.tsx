import { Lock } from "lucide-react";
import { login } from "../actions";

export const metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AdminLogin({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#052a1f] via-[#0a3f2d] to-[#052a1f] px-5 py-10">
      {/* soft gold glow behind the card */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/20 blur-3xl" aria-hidden />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <span className="rounded-2xl bg-white px-5 py-3 shadow-xl">
            <img src="/logo-compact.png" alt="Abu Bakkar Academy" className="h-12 w-auto" />
          </span>
        </div>

        <form action={login} className="space-y-4 rounded-3xl bg-white p-7 shadow-2xl">
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Lock size={18} /></span>
            <h1 className="mt-3 text-2xl font-bold text-navy">Admin sign in</h1>
            <p className="mt-1 text-sm text-slate-500">Manage enrollments, payments and classes.</p>
          </div>
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoFocus autoComplete="username" className="input" /></div>
          <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" className="input" /></div>
          {searchParams.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{searchParams.error}</p>}
          <button className="btn-gold w-full !shadow-none">Sign in</button>
        </form>

        <p className="mt-6 text-center text-xs text-white/50">Abu Bakkar Academy · Sirf Taleem Nahi, Tarbiyat Bhi</p>
      </div>
    </main>
  );
}
