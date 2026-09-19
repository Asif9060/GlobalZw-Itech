import { isLocalStoreAllowed, isSupabaseConfigured } from "@/lib/env";
import { localLeadStore } from "@/lib/leads/backends/local";
import { supabaseLeadStore } from "@/lib/leads/backends/supabase";
import { LeadStoreError, type LeadStore, type LeadStoreKind } from "@/lib/leads/store";

/**
 * Public entry point for lead storage. Server-only — this module transitively
 * imports `node:fs`, so it must never be pulled into a Client Component.
 *
 * Client Components should import types from `@/lib/leads/types` and the site
 * registry from `@/lib/sites`, both of which are dependency-free.
 */

export function getLeadStore(): LeadStore {
  if (isSupabaseConfigured()) return supabaseLeadStore;

  if (isLocalStoreAllowed()) return localLeadStore;

  throw new LeadStoreError(
    "No lead store is configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "SUPABASE_SERVICE_ROLE_KEY, or set ALLOW_LOCAL_STORE=1 to accept the " +
      "non-durable local file store in this environment.",
  );
}

export type StoreDescription = {
  kind: LeadStoreKind | "unconfigured";
  /** Shown in the admin portal so an operator always knows where data lands. */
  label: string;
  /** Non-null when something needs the operator's attention. */
  warning: string | null;
};

export function describeStore(): StoreDescription {
  if (isSupabaseConfigured()) {
    return { kind: "supabase", label: "Supabase", warning: null };
  }

  if (isLocalStoreAllowed()) {
    return {
      kind: "local",
      label: "Local file (.data/store.json)",
      warning:
        "Supabase credentials are not set, so enquiries are being written to a local JSON file. " +
        "Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY " +
        "to .env.local, then run supabase/schema.sql to switch over.",
    };
  }

  return {
    kind: "unconfigured",
    label: "Not configured",
    warning:
      "No lead store is configured and the local fallback is disabled in this environment. " +
      "Set the Supabase environment variables to start accepting enquiries.",
  };
}

export { LeadStoreError };
export type { LeadStore, LeadStoreKind };
export * from "@/lib/leads/types";
