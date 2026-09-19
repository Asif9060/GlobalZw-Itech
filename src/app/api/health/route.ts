import { describeStore } from "@/lib/leads";
import { getSupabaseAdmin, PG_ERROR } from "@/lib/supabase/server";
import { tableNames } from "@/lib/env";

/**
 * GET /api/health — is the backend wired up?
 *
 * The point of this endpoint is to answer "did I paste the right Supabase
 * credentials, and have I applied the schema?" in one request, without opening
 * the admin portal. It reports reachability and schema readiness only — no
 * counts, no customer data — so it is safe to leave public.
 *
 *   { ok: true,  store: "supabase", supabase: "connected", schema: "ready" }
 *   { ok: false, store: "supabase", supabase: "connected", schema: "missing" }
 *   { ok: false, store: "local",    supabase: "unconfigured", schema: "unknown" }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SupabaseState = "connected" | "unreachable" | "unconfigured";
type SchemaState = "ready" | "missing" | "unknown";

export async function GET() {
  const store = describeStore();
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return Response.json(
      {
        ok: store.kind !== "unconfigured",
        store: store.kind,
        supabase: "unconfigured" satisfies SupabaseState,
        schema: "unknown" satisfies SchemaState,
        note: store.warning,
        checkedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // A HEAD count is the cheapest call that proves both connectivity and that
  // the table exists, without pulling any rows.
  const probe = await supabase
    .from(tableNames.leads)
    .select("id", { count: "exact", head: true });

  const schema: SchemaState = probe.error
    ? probe.error.code === PG_ERROR.undefinedTable
      ? "missing"
      : "unknown"
    : "ready";

  const supabaseState: SupabaseState = probe.error && probe.error.code !== PG_ERROR.undefinedTable
    ? "unreachable"
    : "connected";

  return Response.json(
    {
      ok: supabaseState === "connected" && schema === "ready",
      store: store.kind,
      supabase: supabaseState,
      schema,
      note:
        schema === "missing"
          ? "Run supabase/schema.sql in the Supabase SQL editor."
          : probe.error?.message,
      checkedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
