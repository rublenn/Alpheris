import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminDb, publicDb } from "./supabase";

/**
 * Admin login.
 *  1. The password is checked by Supabase Auth (we never store passwords).
 *  2. The user must also be listed in the `admins` table.
 *  3. We then set a signed, httpOnly cookie for 7 days. The signature uses a
 *     key derived from SUPABASE_SECRET_KEY, so nobody can forge it.
 *  4. Every admin page and action re-checks the cookie AND the admins table,
 *     so removing someone from `admins` locks them out immediately.
 */

const COOKIE = "sc_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type AdminUser = { userId: string; email: string };

function signingKey() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is missing.");
  return createHmac("sha256", secret).update("spacecraft-admin-session-v1").digest();
}

function sign(payload: string) {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

function encode(user: AdminUser) {
  const payload = Buffer.from(
    JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + MAX_AGE }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(token: string | undefined): AdminUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.exp !== "number" || data.exp < Date.now() / 1000) return null;
    return { userId: String(data.userId), email: String(data.email) };
  } catch {
    return null;
  }
}

async function isListedAdmin(userId: string) {
  const { data } = await adminDb().from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}

/** Returns an error message, or null when the login worked. */
export async function signInAdmin(email: string, password: string): Promise<string | null> {
  const { data, error } = await publicDb().auth.signInWithPassword({ email, password });
  if (error || !data.user) return "Email or password is incorrect.";
  if (!(await isListedAdmin(data.user.id))) return "This account does not have admin access.";

  (await cookies()).set(COOKIE, encode({ userId: data.user.id, email: data.user.email ?? email }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return null;
}

export async function signOutAdmin() {
  (await cookies()).delete(COOKIE);
}

/** The logged-in admin, or null. */
export async function getAdmin(): Promise<AdminUser | null> {
  const user = decode((await cookies()).get(COOKIE)?.value);
  if (!user) return null;
  return (await isListedAdmin(user.userId)) ? user : null;
}

/** Use at the top of every admin page and admin server action. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdmin();
  if (!user) redirect("/admin/login");
  return user;
}
