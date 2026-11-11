import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, dbConfigured } from "./db";
//
const COOKIE = "aba_admin";
const SESSION_MS = 1000 * 60 * 60 * 12;
const secret = () => process.env.ADMIN_COOKIE_SECRET || "";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

export type Admin = { id: string; email: string; name: string };

// ---- passwords: salted scrypt, stored as "scrypt$salt$hash" ------------------------------------------------------
export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string) {
  const [alg, salt, hash] = (stored || "").split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const want = Buffer.from(hash, "hex"), got = scryptSync(pw, salt, 64);
  return want.length === got.length && timingSafeEqual(want, got);
}
const DUMMY = hashPassword("not-a-real-password");   // keeps response time similar for unknown emails

// ---- brute-force protection (per server instance; good enough to stop casual guessing) -----------------------------
const attempts = new Map<string, { n: number; until: number }>();
function clientKey(email: string) {
  const h = headers();
  const ip = (h.get("x-forwarded-for") || h.get("x-real-ip") || "local").split(",")[0].trim();
  return `${ip}|${email.toLowerCase()}`;
}

export async function attemptLogin(emailRaw: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!dbConfigured() || !secret()) return { ok: false, error: "Admin is not configured (database or ADMIN_COOKIE_SECRET missing)." };
  const email = emailRaw.trim().toLowerCase();
  const key = clientKey(email);
  const a = attempts.get(key);
  if (a && a.until > Date.now()) return { ok: false, error: "Too many attempts. Try again in 15 minutes." };

  const client = db();
  let { data: user } = await client.from("admin_users").select("*").eq("email", email).eq("active", true).maybeSingle();

  // First-ever login: if no admin exists yet, ADMIN_EMAIL + ADMIN_PASSWORD (from the server env) create the first one.
  if (!user) {
    const { data: any1 } = await client.from("admin_users").select("id").limit(1);
    if (!any1?.length && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD
        && email === process.env.ADMIN_EMAIL.trim().toLowerCase() && password === process.env.ADMIN_PASSWORD) {
      const ins = await client.from("admin_users").insert({ email, name: "Owner", password_hash: hashPassword(password) }).select("*").single();
      user = ins.data;
    }
  }

  const ok = user ? verifyPassword(password, user.password_hash) : (verifyPassword(password, DUMMY), false);
  if (!ok || !user) {
    const n = (a?.n || 0) + 1;
    attempts.set(key, { n, until: n >= 5 ? Date.now() + 15 * 60 * 1000 : 0 });
    return { ok: false, error: "Incorrect email or password." };
  }
  attempts.delete(key);
  await client.from("admin_users").update({ last_login: new Date().toISOString() }).eq("id", user.id);

  const exp = String(Date.now() + SESSION_MS);
  const payload = `${user.id}.${exp}`;
  cookies().set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MS / 1000,
  });
  return { ok: true };
}

/** The signed-in admin (re-checked against the database, so deactivating someone logs them out immediately). */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const c = cookies().get(COOKIE)?.value;
  if (!c || !secret() || !dbConfigured()) return null;
  const [id, exp, sig] = c.split(".");
  if (!id || !exp || !sig || Number(exp) < Date.now()) return null;
  const want = Buffer.from(sign(`${id}.${exp}`)), got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const { data } = await db().from("admin_users").select("id,email,name").eq("id", id).eq("active", true).maybeSingle();
  return (data as Admin) ?? null;
});

export async function requireAdmin(): Promise<Admin> {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  return a;
}

export function clearSession() {
  cookies().delete(COOKIE);
}
