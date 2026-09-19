import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads";
import { exportFilename, leadsToCsv, leadsToJson } from "@/lib/leads/export";
import { isLeadStatus } from "@/lib/leads/types";
import { isSiteSlug } from "@/lib/sites";

/**
 * GET /admin/export — downloads the enquiry log.
 *
 * Query parameters
 *   site    optional landing page slug; omit for every page
 *   status  optional `new` | `in_progress` | `resolved`
 *   q       optional search term, matching the admin search box
 *   format  `csv` (default) or `json`
 *
 * A Route Handler rather than a Server Action because the browser needs a real
 * file download with its own headers. Authentication is checked here instead of
 * in a layout, since Route Handlers do not participate in layouts — an operator
 * with no session is bounced to the sign-in screen rather than handed a file.
 */

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    redirect("/admin/login");
  }

  const params = new URL(request.url).searchParams;

  const rawSite = params.get("site");
  if (rawSite && !isSiteSlug(rawSite)) {
    return new Response("Unknown site slug.", { status: 400 });
  }

  const rawStatus = params.get("status");
  if (rawStatus && !isLeadStatus(rawStatus)) {
    return new Response("Unknown status.", { status: 400 });
  }

  const format = params.get("format") === "json" ? "json" : "csv";
  const search = params.get("q")?.slice(0, 80) ?? undefined;

  try {
    const leads = await getLeadStore().listLeads({
      site: rawSite && isSiteSlug(rawSite) ? rawSite : undefined,
      status: rawStatus && isLeadStatus(rawStatus) ? rawStatus : undefined,
      search,
      limit: 500,
    });

    const scope = rawSite && isSiteSlug(rawSite) ? rawSite : "all";
    const body = format === "json" ? leadsToJson(leads) : leadsToCsv(leads);

    return new Response(body, {
      headers: {
        "Content-Type":
          format === "json"
            ? "application/json; charset=utf-8"
            : "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFilename(scope, format)}"`,
        // The file is generated per request and must never be cached.
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[admin/export] failed:", error);
    return new Response("Could not build the export.", { status: 503 });
  }
}
