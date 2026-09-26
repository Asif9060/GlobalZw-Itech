import { formatDateTime } from "@/lib/format";
import type { Subscriber } from "@/lib/leads/types";
import { requireSite } from "@/lib/sites";
import { emailDocument } from "@/lib/email/layout";
import { plainBlock, plainFields } from "@/lib/email/plain";
import { accentOf } from "@/lib/email/theme";
import {
  buttonRow,
  fieldTable,
  quoteBlock,
  sectionLabel,
  spacer,
  statStrip,
  type FieldEntry,
} from "@/lib/email/render";
import type { RenderedEmail } from "@/lib/email/types";

/**
 * The newsletter signup notification.
 *
 * A subscriber has no reference number and no follow-up workflow, so this is a
 * deliberately lighter message than the enquiry one: one fact, where it came
 * from, and a link to the list. It exists because a signup is still a person
 * raising their hand, and nobody should have to open the portal to notice.
 */

export function subscriberNotification(
  subscriber: Subscriber,
  context: { adminUrl: string },
): RenderedEmail {
  const site = requireSite(subscriber.site);
  const accent = accentOf(site.accent);
  const signedUp = formatDateTime(subscriber.createdAt);

  const details: FieldEntry[] = [
    { label: "Site", value: `${site.brand} · ${site.name}` },
    { label: "Signed up", value: signedUp },
    ...(subscriber.sourcePath
      ? [{ label: "Source", value: subscriber.sourcePath }]
      : []),
  ];

  const html = [
    statStrip([{ label: "Email address", value: subscriber.email }], accent),
    spacer(24),
    sectionLabel("Details", accent, true),
    fieldTable(details, accent),
    spacer(24),
    quoteBlock(
      "Newsletter subscribers are kept separate from enquiries — they appear under " +
        "Subscribers in the portal, are not assigned a reference, and do not need a reply.",
      accent,
    ),
    spacer(26),
    buttonRow([
      { label: "Open subscribers", href: context.adminUrl, accent, primary: true },
      { label: "Email them", href: `mailto:${subscriber.email}`, accent },
    ]),
    spacer(22),
  ].join("\n");

  const text = [
    "NEW NEWSLETTER SUBSCRIBER",
    subscriber.email,
    plainBlock(`${site.brand} · ${site.name}`, `Signed up ${signedUp}`),
    plainBlock("DETAILS", plainFields(details)),
    plainBlock("OPEN THE SUBSCRIBER LIST", `  ${context.adminUrl}`),
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    subject: `New subscriber · ${subscriber.email} (${site.brand})`,
    html: emailDocument({
      subject: `New newsletter subscriber: ${subscriber.email}`,
      preheader: `${site.brand} · signed up${subscriber.sourcePath ? ` from ${subscriber.sourcePath}` : ""}`,
      accent,
      badge: "Subscriber",
      title: "New newsletter signup",
      intro: `${site.brand} · ${site.name} — signed up from ${
        subscriber.sourcePath ?? site.path
      }.`,
      body: html,
      footer:
        "You are on the notification list for GlobalZwItech. Newsletter subscribers are " +
        "listed in the admin portal, where they can be exported or removed.",
    }),
    text,
    replyTo: null,
    tags: [
      { name: "kind", value: "subscriber" },
      { name: "site", value: subscriber.site },
    ],
    idempotencyKey: `subscriber/${subscriber.id}`,
  };
}
