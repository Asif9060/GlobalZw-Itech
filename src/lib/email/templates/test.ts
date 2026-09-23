import { formatDateTime } from "@/lib/format";
import { emailDocument } from "@/lib/email/layout";
import { plainBlock, plainFields } from "@/lib/email/plain";
import { PALETTE, accentOf } from "@/lib/email/theme";
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
 * The test message behind the "Send a test email" button in site controls.
 *
 * It reports the configuration that produced it, because a test that only says
 * "it works" is useless when it does not: an operator seeing nothing arrive
 * needs to know which sender, which recipients and whether the sandbox address
 * is still in use, without going back to the environment file to find out.
 */

export type TestNotificationContext = {
  /** Link to site controls, where the button that sent this lives. */
  adminUrl: string;
  from: string;
  recipients: string[];
  replyToOverride: string | null;
  /** Adds the "verify a domain first" callout; see `emailConfig`. */
  sandboxSender: boolean;
};

export function testNotification(
  context: TestNotificationContext,
  now = new Date(),
): RenderedEmail {
  const accent = accentOf(PALETTE.gold);
  const sentAt = formatDateTime(now.toISOString());

  const configuration: FieldEntry[] = [
    { label: "Sender", value: context.from, mono: true },
    { label: "Recipients", value: context.recipients.join(", ") },
    {
      label: "Replies go to",
      value:
        context.replyToOverride ??
        "The customer, on enquiry notifications (no override set)",
    },
    { label: "Sent", value: sentAt },
  ];

  const html = [
    statStrip(
      [
        // "Working" is a word, not a value to be copied character by character,
        // so it stays in the body type rather than the monospace stack.
        { label: "Delivery", value: "Working", mono: false },
        {
          label: "Recipients",
          value: `${context.recipients.length} address${context.recipients.length === 1 ? "" : "es"}`,
        },
      ],
      accent,
    ),
    spacer(24),
    sectionLabel("Configuration", accent, true),
    fieldTable(configuration, accent),
    ...(context.sandboxSender
      ? [
          sectionLabel("Action needed", accent),
          quoteBlock(
            "This is Resend's sandbox sender. It can only deliver to the address that owns " +
              "the Resend account, and it will not reach anyone else. Verify a domain in " +
              "Resend, then set LEAD_NOTIFICATION_FROM to an address on it before going live.",
            accent,
          ),
        ]
      : []),
    spacer(24),
    sectionLabel("What now arrives on its own", accent),
    quoteBlock(
      "Every accepted enquiry is emailed to this list within moments of being stored, " +
        "with the Reply-To set to the customer. Newsletter signups are sent too unless " +
        "notifications are switched off with EMAIL_NOTIFICATIONS=off.",
      accent,
    ),
    spacer(26),
    buttonRow([
      { label: "Open site controls", href: context.adminUrl, accent, primary: true },
    ]),
    spacer(22),
  ].join("\n");

  const text = [
    "NOTIFICATION TEST — DELIVERY WORKING",
    `Sent ${sentAt}`,
    plainBlock("CONFIGURATION", plainFields(configuration)),
    plainBlock("OPEN SITE CONTROLS", `  ${context.adminUrl}`),
  ].join("\n\n");

  return {
    subject: "[Test] Global Suntech notifications are working",
    html: emailDocument({
      subject: "Test notification from Global Suntech",
      preheader: `Delivered to ${context.recipients.length} address${
        context.recipients.length === 1 ? "" : "es"
      } from ${context.from}`,
      accent,
      badge: "Test",
      title: "Notifications are working",
      intro: "This message was sent from the admin portal. If it reached you, Resend is wired up correctly.",
      body: html,
      footer:
        "A test message from the Global Suntech admin portal. Nothing was sent to a customer.",
    }),
    text,
    // A test must never open a mail client pointed at a customer, and must be
    // repeatable — hence no Reply-To and no idempotency key.
    replyTo: context.replyToOverride,
    tags: [{ name: "kind", value: "test" }],
    idempotencyKey: null,
  };
}
