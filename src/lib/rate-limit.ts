/**
 * Fixed-window rate limiter for the public form endpoints.
 *
 * Public forms are the one part of this app anyone can hit, so a cheap
 * in-process limiter is worth having. It is per-instance, which means it slows
 * a single abusive client but does not coordinate across serverless instances —
 * good enough as a speed bump, not a substitute for a WAF.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  /** Seconds until the window resets, for the `Retry-After` header. */
  retryAfter: number;
};

function prune(now: number) {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(key: string, limit = 5, windowMs = 10 * 60 * 1000): RateLimitResult {
  const now = Date.now();
  prune(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);

  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfter };
  }

  return { ok: true, remaining: Math.max(limit - existing.count, 0), retryAfter };
}

/** Test seam — lets a script reset the limiter between runs. */
export function resetRateLimits() {
  buckets.clear();
}
