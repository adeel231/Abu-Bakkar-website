import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const NAME = "aba_admin";
const secret = () => process.env.ADMIN_COOKIE_SECRET || "";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

export function checkPassword(input: string) {
  const pw = process.env.ADMIN_PASSWORD || "";
  if (!pw || !secret()) return false;
  const a = Buffer.from(sign(input));
  const b = Buffer.from(sign(pw));
  return timingSafeEqual(a, b);
}

export function issueSession() {
  const exp = String(Date.now() + 1000 * 60 * 60 * 12);
  cookies().set(NAME, `${exp}.${sign(exp)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 12,
  });
}

export function isAdmin() {
  const c = cookies().get(NAME)?.value;
  if (!c || !secret()) return false;
  const [exp, sig] = c.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(exp));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function requireAdmin() {
  if (!isAdmin()) redirect("/admin/login");
}

export function clearSession() {
  cookies().delete(NAME);
}
