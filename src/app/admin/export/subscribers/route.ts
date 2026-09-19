import { getAdminSession } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads";
import { toCsv } from "@/lib/csv";
import { exportFilename } from "@/lib/leads/export";
import { redirect } from "next/navigation";

/**
 * GET /admin/export/subscribers — downloads the newsletter list.
 *
 * Same authentication rule as the enquiry export: Route Handlers sit outside
 * the admin layout, so the session is checked here.
 */

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    redirect("/admin/login");
  }

  const format = new URL(request.url).searchParams.get("format") === "json" ? "json" : "csv";

  try {
    const subscribers = await getLeadStore().listSubscribers(1000);

    const body =
      format === "json"
        ? JSON.stringify(
            { exportedAt: new Date().toISOString(), count: subscribers.length, subscribers },
            null,
            2,
          )
        : toCsv([
            ["Email", "Landing page", "Signed up", "Source path"],
            ...subscribers.map((subscriber) => [
              subscriber.email,
              subscriber.site,
              subscriber.createdAt,
              subscriber.sourcePath,
            ]),
          ]);

    return new Response(body, {
      headers: {
        "Content-Type":
          format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFilename("subscribers", format)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[admin/export/subscribers] failed:", error);
    return new Response("Could not build the export.", { status: 503 });
  }
}
