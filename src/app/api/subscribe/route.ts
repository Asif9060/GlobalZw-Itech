import { headers } from "next/headers";
import { after } from "next/server";
import { sendSubscriberNotification } from "@/lib/email";
import { getLeadStore, LeadStoreError } from "@/lib/leads";
import { clientIpFrom, hashIp } from "@/lib/leads/ref";
import { isValidEmail } from "@/lib/leads/validate";
import { isSiteSlug } from "@/lib/sites";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/subscribe — footer newsletter signups.
 *
 * Separate from `/api/leads` because a subscriber is not an enquiry: it has no
 * name, no message and no follow-up workflow, and the admin lists them on their
 * own page rather than in a landing page's enquiry section. A genuinely new
 * address is still emailed to the admin notification list, on the same
 * non-blocking `after` schedule the enquiry API uses.
 *
 * Body: `{ site, email, path? }` (JSON) or the same names as form fields.
 */

export const runtime = "nodejs";

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...extraHeaders },
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  let raw: Record<string, unknown> = {};
  try {
    raw = contentType.includes("application/json")
      ? ((await request.json()) as Record<string, unknown>)
      : Object.fromEntries(
          Array.from((await request.formData()).entries()).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        );
  } catch {
    return json({ ok: false, message: "Could not read the request body." }, 400);
  }

  const incoming = await headers();
  const ipHash = hashIp(
    clientIpFrom(incoming),
    process.env.ADMIN_SESSION_SECRET ?? "globalzwitech-ip-salt",
  );

  if (ipHash) {
    const limit = rateLimit(`subscribe:${ipHash}`, 10, 10 * 60 * 1000);
    if (!limit.ok) {
      return json(
        { ok: false, message: "Too many signups from this connection. Try again later." },
        429,
        { "Retry-After": String(Math.max(limit.retryAfter, 1)) },
      );
    }
  }

  const site = raw.site;
  if (!isSiteSlug(site)) {
    return json({ ok: false, message: "Unknown or missing `site`." }, 400);
  }

  const email = typeof raw.email === "string" ? raw.email.trim().slice(0, 254) : "";
  if (!isValidEmail(email)) {
    return json({ ok: false, message: "Enter a valid email address." }, 400, {});
  }

  const path = typeof raw.path === "string" ? raw.path.slice(0, 300) : null;

  try {
    const store = getLeadStore();
    const { subscriber, created } = await store.addSubscriber({
      email,
      site,
      sourcePath: path ?? incoming.get("referer")?.slice(0, 300) ?? null,
    });

    // Only a genuinely new address is worth a notification. A repeat signup
    // already returns success without creating a row, and mailing the operator
    // about it would be noise they cannot act on.
    if (created) {
      after(() => sendSubscriberNotification(subscriber));
    }

    return json({
      ok: true,
      // Both cases read as success to the visitor; `created` is for the caller's
      // own logging so a double signup is not reported as a failure.
      created,
      message: created ? "Subscribed." : "You are already on the list.",
    });
  } catch (error) {
    if (error instanceof LeadStoreError) {
      console.error("[api/subscribe] store failure:", error.message);
      return json({ ok: false, message: "Could not subscribe right now." }, 503);
    }

    console.error("[api/subscribe] unexpected failure:", error);
    return json({ ok: false, message: "Could not subscribe right now." }, 500);
  }
}
