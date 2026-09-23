import { Resend } from "resend";
import { emailConfig } from "@/lib/env";

/**
 * The Resend client, constructed on first use.
 *
 * Built lazily rather than at module load so that a deployment without
 * `RESEND_API_KEY` — which is every deployment until somebody sets it — neither
 * throws at import time nor constructs a client it will never use. The instance
 * is cached against the key it was built from, so rotating the key in a running
 * process picks up the new one instead of sending with the old.
 *
 * Server-only: this module reads a secret and must never be imported from a
 * Client Component.
 */

let cached: { key: string; client: Resend } | null = null;

/** Null when Resend is not configured, which every caller treats as "skip". */
export function resendClient(): Resend | null {
  const { apiKey } = emailConfig();
  if (!apiKey) return null;

  if (!cached || cached.key !== apiKey) {
    cached = { key: apiKey, client: new Resend(apiKey) };
  }

  return cached.client;
}

/** Drops the cached client. Only useful to a test that swaps the key. */
export function resetResendClient(): void {
  cached = null;
}
