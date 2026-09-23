import { headers } from "next/headers";
import { after } from "next/server";
import { sendLeadNotification } from "@/lib/email";
import { getLeadStore, LeadStoreError } from "@/lib/leads";
import { clientIpFrom, hashIp, makeRef } from "@/lib/leads/ref";
import { readLeadPayload, validateLeadSubmission } from "@/lib/leads/validate";
import { requireSite, isSiteSlug } from "@/lib/sites";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/leads — the single write endpoint behind every landing page form.
 *
 * The five pages in `public/` are plain HTML, so this is a Route Handler rather
 * than a Server Action: it has to be callable with `fetch` from a static
 * document. Each page posts an already-canonical payload:
 *
 *   { site, formId, path, fields: { name, email, phone, … }, details: { … } }
 *
 * `application/x-www-form-urlencoded` and `multipart/form-data` are accepted
 * too, using the canonical field names, so the endpoint can be exercised with
 * curl. See `readLeadPayload`.
 *
 * A stored enquiry is also emailed to the admin notification list — see
 * `src/lib/email`. That send is scheduled with `after`, so it happens once the
 * customer's response has been flushed and can never turn a saved enquiry into
 * an error the visitor sees.
 *
 * Responses
 *   200 { ok: true,  ref }              stored (or silently dropped as spam)
 *   400 { ok: false, message, errors }  validation failed
 *   403 { ok: false, message }          that page is closed to new enquiries
 *   429 { ok: false, message }          too many submissions from one address
 *   503 { ok: false, message }          no lead store configured
 */

export const runtime = "nodejs";

const LIMIT_PER_WINDOW = 8;
const WINDOW_MS = 10 * 60 * 1000;

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...extraHeaders },
  });
}

/**
 * A hidden field real visitors never fill in. When it is populated we return a
 * normal-looking success so the bot has no signal, but nothing is stored.
 */
function isHoneypotTripped(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  const payload = raw as Record<string, unknown>;

  const candidates = [
    payload.honeypot,
    payload.website,
    (payload.details as Record<string, unknown> | undefined)?.honeypot,
    (payload.details as Record<string, unknown> | undefined)?.website,
  ];

  return candidates.some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

export async function POST(request: Request) {
  const incoming = await headers();

  const ipHash = hashIp(
    clientIpFrom(incoming),
    process.env.ADMIN_SESSION_SECRET ?? "globalzwitech-ip-salt",
  );

  // Without a client address (only possible on direct local connections) we
  // skip limiting rather than lumping every visitor into one shared bucket.
  if (ipHash) {
    const limit = rateLimit(`leads:${ipHash}`, LIMIT_PER_WINDOW, WINDOW_MS);
    if (!limit.ok) {
      return json(
        {
          ok: false,
          message: "Too many submissions from this connection. Please try again shortly.",
        },
        429,
        { "Retry-After": String(Math.max(limit.retryAfter, 1)) },
      );
    }
  }

  const payload = await readLeadPayload(request);

  if (isHoneypotTripped(payload)) {
    const claimedSite = (payload as { site?: unknown }).site;
    return json({
      ok: true,
      ref: isSiteSlug(claimedSite) ? makeRef(claimedSite) : "GS-000000",
      id: null,
    });
  }

  const validated = validateLeadSubmission(payload);
  if (!validated.ok) {
    return json(
      { ok: false, message: validated.message, errors: validated.errors },
      400,
    );
  }

  const submission = validated.value;

  try {
    const store = getLeadStore();

    const settings = await store.getSiteSettings();
    if (settings[submission.site]?.acceptingLeads === false) {
      const { name } = requireSite(submission.site);
      return json(
        {
          ok: false,
          message: `We have paused new enquiries from the ${name} page. Please email us directly and we will pick it up.`,
        },
        403,
      );
    }

    const lead = await store.createLead({
      ...submission,
      referrer: request.headers.get("referer")?.slice(0, 300) ?? null,
      userAgent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
      ipHash,
    });

    // Not awaited: the visitor's reference number is not held up by Resend, and
    // `sendLeadNotification` resolves to a result rather than throwing, so a
    // mail failure cannot surface here as a failed submission.
    after(() => sendLeadNotification(lead));

    return json({ ok: true, ref: lead.ref, id: lead.id });
  } catch (error) {
    if (error instanceof LeadStoreError) {
      console.error("[api/leads] store failure:", error.message);
      return json(
        { ok: false, message: "We could not save your enquiry right now. Please try again." },
        503,
      );
    }

    console.error("[api/leads] unexpected failure:", error);
    return json(
      { ok: false, message: "Something went wrong on our side. Please try again." },
      500,
    );
  }
}

export async function GET() {
  return json({ ok: false, message: "Use POST to submit an enquiry." }, 405);
}
