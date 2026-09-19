import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, adminAuthConfig } from "@/lib/env";

/**
 * Admin portal authentication.
 *
 * A single operator account, guarded by a password from the environment, with
 * the session carried in an HMAC-signed cookie. There is no user table and no
 * database round trip on each request, which keeps the portal usable before
 * Supabase credentials exist.
 *
 * Swapping this for Supabase Auth later means replacing `getAdminSession()` and
 * the two exports in `src/app/admin/actions.ts` that call `verify`/`issue`;
 * every page and action already funnels through `requireAdmin()`.
 *
 * The cookie is signed, not encrypted: it holds nothing but an expiry.
 */

const SESSION_SUBJECT = "admin";

type SessionPayload = {
  sub: string;
  /** Issued at, seconds since epoch. */
  iat: number;
  /** Expires at, seconds since epoch. */
  exp: number;
};

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

/** Constant-time string compare that does not leak length through timing. */
function safeEqual(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const config = adminAuthConfig();

  // The email is optional; when set it must match as well.
  const emailOk = config.email ? safeEqual(email.trim().toLowerCase(), config.email.toLowerCase()) : true;
  const passwordOk = safeEqual(password, config.password);

  // Both comparisons always run, so a wrong email costs the same as a wrong
  // password and neither can be probed independently.
  return emailOk && passwordOk;
}

function issueToken(): { token: string; maxAge: number } {
  const config = adminAuthConfig();
  const now = Math.floor(Date.now() / 1000);
  const maxAge = config.sessionHours * 60 * 60;

  const payload: SessionPayload = {
    sub: SESSION_SUBJECT,
    iat: now,
    exp: now + maxAge,
  };

  const body = base64url(JSON.stringify(payload));
  return { token: `${body}.${sign(body, config.sessionSecret)}`, maxAge };
}

function readToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body, adminAuthConfig().sessionSecret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (payload.sub !== SESSION_SUBJECT) return null;
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export type AdminSession = { expiresAt: Date };

/** Reads and verifies the session cookie. `null` means signed out. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const payload = readToken(store.get(ADMIN_SESSION_COOKIE)?.value);
  return payload ? { expiresAt: new Date(payload.exp * 1000) } : null;
}

/** For Server Components: bounces to the login screen when signed out. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * For Server Actions and Route Handlers. Unlike `requireAdmin` this throws
 * rather than redirects, because a redirect is not a useful answer to a
 * mutation that arrived over POST — a stale form should fail, loudly, not
 * silently navigate.
 *
 * Every action calls this: Server Functions are reachable by direct POST, so
 * hiding the UI is not authorization.
 */
export async function assertAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Not authorised. Sign in to the admin portal and try again.");
  }
  return session;
}

/* ── cookie handling, called only from Server Actions ───────────────────── */

export async function startAdminSession(): Promise<void> {
  const { token, maxAge } = issueToken();
  const store = await cookies();

  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}

/** Development-only hints surfaced on the login screen. */
export function adminAuthWarnings(): string[] {
  try {
    return adminAuthConfig().warnings;
  } catch {
    return [];
  }
}
