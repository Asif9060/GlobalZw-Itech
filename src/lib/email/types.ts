/**
 * The shape every notification template returns.
 *
 * A template is a pure function from domain data to this object — no network,
 * no environment lookups beyond what the caller passes in. That keeps the HTML
 * testable and keeps the decision about *who* gets mailed in one place
 * (`src/lib/email/index.ts`).
 */

export type EmailTag = {
  name: string;
  value: string;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  /** The alternative a plain-text client, or a spam filter, actually reads. */
  text: string;
  /** Where a reply should go. For an enquiry: the customer's own address. */
  replyTo: string | null;
  /** Surfaced in the Resend dashboard, so sends can be filtered by page and kind. */
  tags: EmailTag[];
  /**
   * Resend drops a second message with a key it has already seen. Every
   * notification is keyed on the row it describes, so a retried `after()`
   * callback cannot mail the operator twice about one enquiry.
   */
  idempotencyKey: string | null;
};
