import { leadNotification } from "@/lib/email/templates/lead";
import { subscriberNotification } from "@/lib/email/templates/subscriber";
import { testNotification } from "@/lib/email/templates/test";
import type { Lead, Subscriber } from "@/lib/leads/types";
import type { RenderedEmail } from "@/lib/email/types";

/**
 * Dev-only preview of the notification emails.
 *
 * `/api/dev/email-preview` lists the three messages; `?template=lead`,
 * `?template=subscriber` and `?template=test` render one as a document you can
 * open in a browser and look at.
 *
 * It exists because styling an email you cannot see is guesswork: every client
 * renders tables, border-radius and dark mode differently, and the fastest way
 * to catch a broken row is to put the HTML in a window that is 600px wide. The
 * data below is fixed rather than generated so two people comparing screenshots
 * are looking at the same thing.
 *
 * Inert outside development, like `/api/dev-reload` — both the index and every
 * template return 404 in a production build.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SAMPLE_LEAD: Lead = {
  id: "00000000-0000-4000-8000-000000000001",
  ref: "SL-482913",
  site: "solar-solutions",
  formId: "queryForm",
  status: "new",
  name: "Nadia Fourie",
  email: "nadia.fourie@kaapstadsolar.co.za",
  phone: "+27 82 555 0184",
  company: "Kaapstad Solar Projects (Pty) Ltd",
  country: "South Africa",
  city: "Cape Town",
  location: null,
  enquiryType: "Commercial rooftop PV",
  systemType: "Hybrid — PV with battery storage",
  quantity: "480 panels",
  message:
    "Good day,\n\nWe are retrofitting a cold-storage warehouse in Epping and want to cut our " +
    "grid draw during the 18:00–20:00 peak.\n\nTwo questions before we book a site visit:\n" +
    "1. Can the inverter fleet ride through a 4-hour outage without diesel?\n" +
    "2. Do you handle the CoCT embedded-generation application, or is that on us?\n\n" +
    "Happy to send the roof survey if that helps you size it.",
  details: {
    monthly_bill: "R185 000",
    roof_area: "3 400 m²",
    preferred_timeline: "Q1 2027",
  },
  sourcePath: "/solar-solutions",
  referrer: "https://www.google.com/search?q=commercial+solar+capetown",
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/141.0.0.0 Safari/537.36",
  ipHash: "9f2c41ab77e0d3b1c8a5e6f7d0b93c21",
  createdAt: "2026-09-21T09:14:00.000Z",
  updatedAt: "2026-09-21T09:14:00.000Z",
};

/** A page whose form only collects the three required fields. */
const SPARSE_LEAD: Lead = {
  ...SAMPLE_LEAD,
  ref: "LX-104772",
  site: "led-lighting",
  formId: "quoteForm",
  name: "Thabo",
  email: "thabo@example.com",
  phone: null,
  company: null,
  country: null,
  city: null,
  enquiryType: null,
  systemType: null,
  quantity: null,
  message: "Price on 40 high-mast fittings, please.",
  details: {},
  sourcePath: "/led-lighting",
  referrer: null,
  userAgent: null,
  ipHash: null,
};

const SAMPLE_SUBSCRIBER: Subscriber = {
  id: "00000000-0000-4000-8000-000000000002",
  email: "procurement@trafficworks.co.za",
  site: "traffic-solutions",
  sourcePath: "/traffic-solutions",
  createdAt: "2026-09-21T11:02:00.000Z",
};

function render(name: string): RenderedEmail | null {
  switch (name) {
    case "lead":
      return leadNotification(SAMPLE_LEAD, {
        adminUrl: "http://localhost:3000/admin/sites/solar-solutions",
      });
    case "lead-sparse":
      return leadNotification(SPARSE_LEAD, {
        adminUrl: "http://localhost:3000/admin/sites/led-lighting",
      });
    case "subscriber":
      return subscriberNotification(SAMPLE_SUBSCRIBER, {
        adminUrl: "http://localhost:3000/admin/subscribers",
      });
    case "test":
      return testNotification({
        adminUrl: "http://localhost:3000/admin/settings",
        from: "GlobalZwItech <notifications@globalsuntech.com>",
        recipients: ["ops@globalsuntech.com", "sales@globalsuntech.com"],
        replyToOverride: null,
        sandboxSender: false,
      });
    case "test-sandbox":
      // The same message as it reads while `LEAD_NOTIFICATION_FROM` is still
      // unset, which is the state a fresh deployment is actually in.
      return testNotification({
        adminUrl: "http://localhost:3000/admin/settings",
        from: "GlobalZwItech <onboarding@resend.dev>",
        recipients: ["ops@globalsuntech.com"],
        replyToOverride: null,
        sandboxSender: true,
      });
    default:
      return null;
  }
}

const TEMPLATES = [
  { slug: "lead", label: "Enquiry — full payload" },
  { slug: "lead-sparse", label: "Enquiry — minimum fields" },
  { slug: "subscriber", label: "Newsletter signup" },
  { slug: "test", label: "Notification test" },
  { slug: "test-sandbox", label: "Notification test — sandbox sender" },
];

function indexPage(): string {
  const links = TEMPLATES.map(
    (template) =>
      `<li style="margin:10px 0;"><a href="?template=${template.slug}" ` +
      `style="color:#ffb703;font-size:15px;">${template.label}</a></li>`,
  ).join("");

  return (
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"/>` +
    `<title>Notification previews</title></head>` +
    `<body style="margin:0;padding:48px 24px;background:#07090d;color:#e9eefb;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">` +
    `<div style="max-width:640px;margin:0 auto;">` +
    `<div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;` +
    `color:#ffb703;">Development only</div>` +
    `<h1 style="font-size:26px;margin:10px 0 6px;">Notification email previews</h1>` +
    `<p style="color:#9aa7bd;font-size:14px;line-height:1.6;margin:0 0 22px;">` +
    `Fixed sample data, so two screenshots of the same template are comparable. ` +
    `Append <code>?template=lead&amp;text=1</code> for the plain-text alternative.</p>` +
    `<ul style="padding-left:20px;margin:0;">${links}</ul>` +
    `</div></body></html>`
  );
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  const params = new URL(request.url).searchParams;
  const name = params.get("template");
  if (!name) {
    return new Response(indexPage(), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const email = render(name);
  if (!email) {
    return new Response("Unknown template. Try ?template=lead", { status: 404 });
  }

  // The plain-text part is what lands in a terminal client or a spam filter, so
  // it is worth being able to read without a mail client.
  if (params.has("text")) {
    return new Response(email.text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(email.html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
