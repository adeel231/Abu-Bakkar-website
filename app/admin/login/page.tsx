import { login } from "../actions";

export const metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AdminLogin({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <form action={login} className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-navy">Admin sign in</h1>
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoFocus autoComplete="username" className="input" /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" className="input" /></div>
        {searchParams.error && <p role="alert" className="text-sm font-medium text-red-700">{searchParams.error}</p>}
        <button className="btn-emerald w-full">Sign in</button>
      </form>
    </main>
  );
}
