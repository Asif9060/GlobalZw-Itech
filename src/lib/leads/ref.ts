import { createHash, randomInt } from "node:crypto";
import type { SiteSlug } from "@/lib/sites";
import { requireSite } from "@/lib/sites";
import type { NewLead } from "@/lib/leads/types";

/**
 * Customer-facing reference numbers, e.g. `TF-482913`.
 *
 * The prefix identifies the landing page so an operator can tell at a glance
 * which site an enquiry came from. The numeric part is drawn from a CSPRNG
 * rather than `Math.random`, and uniqueness is ultimately guaranteed by the
 * `leads.ref` unique index — writers retry on collision (see `withRefRetry`).
 */

const REF_DIGITS = 6;

export function makeRef(site: SiteSlug): string {
  const { refPrefix } = requireSite(site);
  const max = 10 ** REF_DIGITS;
  const digits = String(randomInt(0, max)).padStart(REF_DIGITS, "0");
  return `${refPrefix}-${digits}`;
}

/**
 * Runs `attempt` until it produces a reference that is not already taken.
 * `isTaken` reports whether the reference collides; in practice this is the
 * database's unique-violation error rather than a pre-flight lookup, so the
 * callback is handed the generated reference and decides.
 */
export async function withRefRetry<T>(
  site: SiteSlug,
  attempt: (ref: string) => Promise<T>,
  isCollision: (error: unknown) => boolean,
  tries = 5,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < tries; i += 1) {
    try {
      return await attempt(makeRef(site));
    } catch (error) {
      if (!isCollision(error)) throw error;
      lastError = error;
    }
  }
  throw lastError ?? new Error("Could not allocate a unique reference");
}

/**
 * We store a hash of the submitter's IP, never the address. That is enough to
 * rate-limit and spot repeated submissions without retaining personal data.
 * The salt makes the hash useless to anyone who only has a copy of the table.
 */
export function hashIp(ip: string | null, salt: string): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Best-effort client address behind a proxy, in Vercel/Cloudflare header order. */
export function clientIpFrom(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-vercel-forwarded-for") ??
    null
  );
}

/**
 * Copies the canonical fields off a validated lead. Used by the local backend,
 * which stores `Lead` objects directly instead of database rows.
 */
export function flattenFields(input: NewLead) {
  return {
    name: input.fields.name ?? "",
    email: input.fields.email ?? "",
    phone: input.fields.phone ?? null,
    company: input.fields.company ?? null,
    country: input.fields.country ?? null,
    city: input.fields.city ?? null,
    location: input.fields.location ?? null,
    enquiryType: input.fields.enquiryType ?? null,
    systemType: input.fields.systemType ?? null,
    quantity: input.fields.quantity ?? null,
    message: input.fields.message ?? null,
  };
}
