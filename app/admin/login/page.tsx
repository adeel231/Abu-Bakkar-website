import { login } from "../actions";

export const metadata = { title: "Admin", robots: { index: false } };

export default function AdminLogin({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <form action={login} className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-navy">Admin login</h1>
        <input name="password" type="password" required autoFocus className="input" placeholder="Password" />
        {searchParams.error && <p className="text-sm text-red-700">Incorrect password.</p>}
        <button className="btn-emerald w-full">Sign in</button>
      </form>
    </main>
  );
}
