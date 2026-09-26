import { formatDateTime } from "@/lib/format";
import type { Lead } from "@/lib/leads/types";
import { requireSite } from "@/lib/sites";
import { emailDocument } from "@/lib/email/layout";
import { plainBlock, plainFields, plainRule } from "@/lib/email/plain";
import { accentOf } from "@/lib/email/theme";
import {
  buttonRow,
  fieldTable,
  metaList,
  quoteBlock,
  sectionLabel,
  spacer,
  statStrip,
  truncate,
  type FieldEntry,
} from "@/lib/email/render";
import type { RenderedEmail } from "@/lib/email/types";

/**
 * The new-enquiry notification.
 *
 * Written to be actionable from the inbox alone: who to contact and how is in
 * the first block, what they want is in the second, and the Reply-To is set to
 * the customer so hitting Reply starts the answer rather than a reply to the
 * automation. Everything an operator would otherwise open the portal to check —
 * the reference, the page, the form, the arrival time — is on the message.
 *
 * The accent colour and brand come from the site registry, so a TRAFLOW enquiry
 * and a LUMENAX enquiry are distinguishable at a glance in a list.
 */

/** `https://example.com/page` → `example.com`; unparseable input is shown as-is. */
function referrerHost(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).host || referrer;
  } catch {
    return referrer;
  }
}

/** `tel:` wants a dialable string, not the spacing a person typed. */
function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** City and country, or the free-text location when the page collects that instead. */
function placeOf(lead: Lead): string | null {
  const parts = [lead.city, lead.country].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return lead.location;
}

function mailtoFor(lead: Lead): string {
  return `mailto:${lead.email}?subject=${encodeURIComponent(`Re: ${lead.ref}`)}`;
}

/**
 * Every line of a customer's message, shifted right so it reads as quoted.
 * Blank lines are left empty rather than filled with padding, so the plain-text
 * part carries no trailing whitespace.
 */
function indent(value: string, spaces = 4): string {
  const pad = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => (line.trim() ? `${pad}${line}` : ""))
    .join("\n");
}

export function leadNotification(
  lead: Lead,
  context: { adminUrl: string },
): RenderedEmail {
  const site = requireSite(lead.site);
  const accent = accentOf(site.accent);
  const where = placeOf(lead);
  const received = formatDateTime(lead.createdAt);

  /* ── HTML blocks ──────────────────────────────────────────────────────── */

  const contact: FieldEntry[] = [
    { label: "Name", value: lead.name },
    { label: "Email", value: lead.email, href: `mailto:${lead.email}` },
    ...(lead.phone
      ? [{ label: "Phone", value: lead.phone, href: phoneHref(lead.phone) }]
      : []),
    ...(lead.company ? [{ label: "Company", value: lead.company }] : []),
    ...(where ? [{ label: "Location", value: where }] : []),
  ];

  const enquiry: FieldEntry[] = [
    ...(lead.enquiryType ? [{ label: "Enquiry type", value: lead.enquiryType }] : []),
    ...(lead.systemType ? [{ label: "System type", value: lead.systemType }] : []),
    ...(lead.quantity ? [{ label: "Estimated quantity", value: lead.quantity }] : []),
  ];

  // Answers the page collected that have no column of their own. Their keys are
  // whatever the form used, so underscores become spaces and nothing else is
  // done to them — inventing labels for unknown fields would be guessing.
  const extras: FieldEntry[] = Object.entries(lead.details).map(([key, value]) => ({
    label: key.replace(/_/g, " "),
    value,
  }));

  const submission: FieldEntry[] = [
    { label: "Landing page", value: lead.sourcePath ?? site.path },
    ...(lead.formId ? [{ label: "Form", value: `#${lead.formId}` }] : []),
    ...(referrerHost(lead.referrer)
      ? [{ label: "Came from", value: referrerHost(lead.referrer)! }]
      : []),
    ...(lead.userAgent ? [{ label: "Browser", value: truncate(lead.userAgent, 110) }] : []),
    ...(lead.ipHash
      ? [{ label: "Client hash", value: `${lead.ipHash.slice(0, 12)}…`, mono: true }]
      : []),
  ];

  const html = [
    statStrip(
      [
        { label: "Reference", value: lead.ref },
        { label: "Received", value: received },
      ],
      accent,
    ),
    spacer(24),
    sectionLabel("Contact", accent, true),
    fieldTable(contact, accent),
    ...(enquiry.length > 0
      ? [sectionLabel("Enquiry", accent), fieldTable(enquiry, accent)]
      : []),
    ...(extras.length > 0
      ? [sectionLabel("Additional answers", accent), fieldTable(extras, accent)]
      : []),
    ...(lead.message
      ? [sectionLabel("Message", accent), quoteBlock(lead.message, accent)]
      : []),
    spacer(26),
    buttonRow([
      { label: "Open in admin", href: context.adminUrl, accent, primary: true },
      {
        label: `Reply to ${truncate(lead.name.split(" ")[0] || lead.name, 18)}`,
        href: mailtoFor(lead),
        accent,
      },
    ]),
    spacer(28),
    sectionLabel("Submission details", accent),
    metaList(submission),
    spacer(22),
  ].join("\n");

  /* ── plain text ───────────────────────────────────────────────────────── */

  const text = [
    `NEW ENQUIRY — ${lead.ref}`,
    plainBlock(`${site.brand} · ${site.name}`, `Received ${received}`),

    plainBlock("CONTACT", plainFields([
      { label: "Name", value: lead.name },
      { label: "Email", value: lead.email },
      { label: "Phone", value: lead.phone },
      { label: "Company", value: lead.company },
      { label: "Location", value: where },
    ])),

    enquiry.length > 0
      ? plainBlock("ENQUIRY", plainFields([
          { label: "Type", value: lead.enquiryType },
          { label: "System", value: lead.systemType },
          { label: "Quantity", value: lead.quantity },
        ]))
      : "",

    extras.length > 0
      ? plainBlock(
          "ADDITIONAL ANSWERS",
          extras.map((entry) => plainFields([entry])).join(""),
        )
      : "",

    lead.message
      ? plainBlock("MESSAGE", `${plainRule()}${indent(lead.message)}`)
      : "",

    plainBlock("REPLY", `  ${lead.email}`),
    plainBlock("SUBMISSION DETAILS", plainFields(submission)),
    plainBlock("OPEN IN THE ADMIN PORTAL", `  ${context.adminUrl}`),
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    subject: `New enquiry · ${lead.ref} · ${truncate(lead.name, 42)} (${site.brand})`,
    html: emailDocument({
      subject: `New enquiry ${lead.ref} from ${lead.name}`,
      preheader: [
        lead.enquiryType,
        lead.email,
        lead.phone,
        lead.company,
      ]
        .filter(Boolean)
        .join(" · "),
      accent,
      badge: "New enquiry",
      title: `New enquiry from ${lead.name}`,
      intro: `${site.brand} · ${site.name} — submitted from ${
        lead.sourcePath ?? site.path
      }.`,
      body: html,
      footer:
        "You are on the enquiry notification list for GlobalZwItech. Replying to this " +
        "message goes straight to the customer. The enquiry is also in the admin portal — " +
        "this email is a copy, not the record.",
    }),
    text,
    replyTo: lead.email,
    tags: [
      { name: "kind", value: "lead" },
      { name: "site", value: lead.site },
    ],
    idempotencyKey: `lead/${lead.id}`,
  };
}
