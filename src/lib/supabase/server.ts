import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

/**
 * Server-side Supabase client.
 *
 * This uses the **service role** key, so it bypasses Row Level Security. That is
 * deliberate: the `leads` table has RLS enabled with no policies, which means
 * the anon key can neither read nor write it. Every read and write therefore
 * goes through the server, which is where authorization is enforced.
 *
 * Consequences to respect:
 *   - Never import this module from a Client Component.
 *   - Only ever return mapped DTOs (see `src/lib/leads/map.ts`), never raw rows.
 *
 * `createClient` holds no per-user session state here, so one module-level
 * instance is safe and avoids rebuilding the client on every request.
 */

let cached: SupabaseClient | null = null;
let cachedForUrl: string | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  const url = publicEnv.supabaseUrl;
  if (cached && cachedForUrl === url) return cached;

  cached = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "globalzwitech-server" } },
  });
  cachedForUrl = url;
  return cached;
}

/** PostgREST error codes we translate into friendly messages. */
export const PG_ERROR = {
  uniqueViolation: "23505",
  undefinedTable: "42P01",
} as const;

/**
 * Turns a PostgREST error into something an operator can act on. A missing
 * table almost always means `supabase/schema.sql` was never applied, so it is
 * worth saying that outright rather than surfacing "relation does not exist".
 */
export function describeSupabaseError(error: {
  code?: string;
  message?: string;
  hint?: string | null;
}): string {
  if (error.code === PG_ERROR.undefinedTable) {
    return "Supabase is reachable but the tables are missing. Run supabase/schema.sql in the Supabase SQL editor, then retry.";
  }
  return [error.message, error.hint].filter(Boolean).join(" — ") || "Unknown Supabase error";
}
