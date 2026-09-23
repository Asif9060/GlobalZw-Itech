import { emailConfig, isEmailConfigured, publicEnv } from "@/lib/env";
import type { Lead, Subscriber } from "@/lib/leads/types";
import { resendClient } from "@/lib/email/client";
import { leadNotification } from "@/lib/email/templates/lead";
import { subscriberNotification } from "@/lib/email/templates/subscriber";
import { testNotification } from "@/lib/email/templates/test";
import type { RenderedEmail } from "@/lib/email/types";

/**
 * Notifications for the admin team, sent through Resend.
 *
 * The rule this module exists to enforce: **a notification can never affect a
 * submission.** Every function here resolves to an outcome object instead of
 * throwing, so a Resend outage, a revoked key or a malformed address degrades to
 * a log line while the enquiry is still stored and still returns its reference
 * to the customer. Nothing in the write path awaits a send for its result.
 *
 * Callers schedule the send with `after()` from `next/server` so it runs once
 * the customer's response has been flushed — see `src/app/api/leads/route.ts`.
 */

export type SendOutcome =
  /** Handed to Resend; `id` is its message id. */
  | { ok: true; id: string; recipients: string[] }
  /** `skipped` means deliberately not attempted; otherwise the send failed. */
  | { ok: false; skipped: boolean; reason: string };

/* ── configuration, as the admin UI needs to see it ─────────────────────── */

export type EmailDescription = {
  /** True when a send would actually be attempted right now. */
  configured: boolean;
  /** False when switched off with EMAIL_NOTIFICATIONS=off. */
  enabled: boolean;
  from: string;
  recipients: string[];
  replyToOverride: string | null;
  /** Whether newsletter signups are notified about as well as enquiries. */
  subscriberNotifications: boolean;
  /** Resend's shared sender only delivers to the Resend account's own address. */
  sandboxSender: boolean;
  warnings: string[];
};

export function describeEmail(): EmailDescription {
  const config = emailConfig();

  return {
    configured: isEmailConfigured(),
    enabled: config.enabled,
    from: config.from,
    recipients: config.recipients,
    replyToOverride: config.replyToOverride,
    subscriberNotifications: config.subscriberNotifications,
    sandboxSender: config.sandboxSender,
    warnings: config.warnings,
  };
}

/* ── transport ──────────────────────────────────────────────────────────── */

/**
 * A send that was skipped for a configuration reason is worth saying out loud
 * once — an operator who deploys without a key should not have to infer it from
 * an empty inbox. Once per process, because otherwise every submission would
 * repeat the same line forever.
 */
let skipWarned = false;

function noteSkip(reason: string): void {
  if (skipWarned) return;
  skipWarned = true;
  console.warn(
    `[email] Not sending admin notifications: ${reason} ` +
      `Enquiries are still stored and visible in /admin/settings.`,
  );
}

/**
 * Sends one rendered message to the configured list.
 *
 * A single message addressed to everyone, not one per recipient: this is an
 * internal notification list, and everyone seeing who else was told is how the
 * team avoids two people answering the same enquiry. (Move the tail of the list
 * into `bcc` if that ever needs to change.)
 */
async function deliver(
  message: RenderedEmail,
  context: string,
  overrideRecipients?: string[],
): Promise<SendOutcome> {
  const config = emailConfig();

  if (!config.enabled) {
    const reason = "Email notifications are switched off.";
    noteSkip(reason);
    return { ok: false, skipped: true, reason };
  }

  const recipients = overrideRecipients ?? config.recipients;
  if (recipients.length === 0) {
    const reason =
      "No notification recipient is configured. Set LEAD_NOTIFICATION_TO or ADMIN_EMAIL.";
    noteSkip(reason);
    return { ok: false, skipped: true, reason };
  }

  const client = resendClient();
  if (!client) {
    const reason = "RESEND_API_KEY is not set, so nothing was sent.";
    noteSkip(reason);
    return { ok: false, skipped: true, reason };
  }

  // An explicit override wins over the template's choice: when an operator sets
  // one, they mean "all replies land here", including replies to an enquiry.
  const replyTo = config.replyToOverride ?? message.replyTo ?? undefined;

  try {
    const { data, error } = await client.emails.send(
      {
        from: config.from,
        to: recipients,
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo,
        tags: message.tags,
      },
      message.idempotencyKey ? { idempotencyKey: message.idempotencyKey } : undefined,
    );

    if (error) {
      console.error(`[email] ${context} — Resend rejected the message: ${error.message}`);
      return { ok: false, skipped: false, reason: error.message };
    }

    console.info(
      `[email] ${context} — sent ${data.id} to ${recipients.length} recipient(s)`,
    );
    return { ok: true, id: data.id, recipients };
  } catch (error) {
    // A network failure, a DNS problem, a timeout. Never rethrown: the caller is
    // inside `after()`, where an unhandled rejection is only noise in the log.
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[email] ${context} — send failed: ${reason}`);
    return { ok: false, skipped: false, reason };
  }
}

/* ── the notifications ──────────────────────────────────────────────────── */

function adminSiteUrl(slug: string): string {
  return `${publicEnv.siteUrl.replace(/\/+$/, "")}/admin/sites/${slug}`;
}

function adminUrl(path: string): string {
  return `${publicEnv.siteUrl.replace(/\/+$/, "")}${path}`;
}

/** Tells the admin list that an enquiry arrived. Never throws. */
export async function sendLeadNotification(lead: Lead): Promise<SendOutcome> {
  return deliver(
    leadNotification(lead, { adminUrl: adminSiteUrl(lead.site) }),
    `lead ${lead.ref}`,
  );
}

/** Tells the admin list that somebody joined the newsletter. Never throws. */
export async function sendSubscriberNotification(
  subscriber: Subscriber,
): Promise<SendOutcome> {
  if (!emailConfig().subscriberNotifications) {
    return {
      ok: false,
      skipped: true,
      reason: "Subscriber notifications are switched off.",
    };
  }

  return deliver(
    subscriberNotification(subscriber, { adminUrl: adminUrl("/admin/subscribers") }),
    `subscriber ${subscriber.email}`,
  );
}

/**
 * Sends the test message from site controls. Unlike the others this resolves
 * with its outcome *before* anything is shown to the operator, because the whole
 * point is to report whether Resend accepted the message.
 *
 * `overrideRecipient` lets an operator prove delivery to a colleague's inbox
 * without adding them to the notification list first.
 */
export async function sendTestEmail(
  overrideRecipient?: string | null,
): Promise<SendOutcome> {
  const config = emailConfig();

  return deliver(
    testNotification({
      adminUrl: adminUrl("/admin/settings"),
      from: config.from,
      recipients: overrideRecipient ? [overrideRecipient] : config.recipients,
      replyToOverride: config.replyToOverride,
      sandboxSender: config.sandboxSender,
    }),
    overrideRecipient ? `test to ${overrideRecipient}` : "test message",
    overrideRecipient ? [overrideRecipient] : undefined,
  );
}
