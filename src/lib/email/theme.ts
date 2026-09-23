/**
 * Palette and type stacks for the notification emails.
 *
 * These are deliberately hard-coded rather than imported from `admin.css`: an
 * email client has no CSS custom properties, no `var()`, and no external
 * stylesheet. Every value here has to be usable as a literal inline style, and
 * it has to look right in clients that strip `<style>` blocks entirely.
 *
 * The design mirrors the admin portal — near-black canvas, a raised panel, one
 * accent per landing page — so a notification is recognisable as coming from the
 * same product the operator signs in to.
 */

export const PALETTE = {
  /** Page background, outside the card. */
  canvas: "#07090d",
  /** The card itself. */
  panel: "#0f131b",
  /** Inset blocks inside the card (reference strip, quote, provenance). */
  inset: "#151b26",
  /** Hairline between rows and sections. */
  line: "#1e2634",
  /** Softer hairline, used between field rows. */
  lineSoft: "#181e2a",
  ink: "#e9eefb",
  muted: "#9aa7bd",
  dim: "#6f7c92",
  /** Fallback accent for messages that are not tied to a landing page. */
  gold: "#ffb703",
} as const;

/**
 * System stacks only. Web fonts are not loaded in email: Apple Mail and Gmail
 * honour `@font-face` inconsistently and Outlook not at all, and a font request
 * that silently fails is worse than a font that is merely ordinary.
 */
export const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/** Reference numbers, timestamps and ids — anything read digit by digit. */
export const FONT_MONO =
  "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace";

/** The card is 600px; the body copy column is that minus the 32px gutters. */
export const CONTENT_WIDTH = 600;

/**
 * The templates build translucent tints and borders by appending an alpha pair
 * to the accent (`#38bdf8` + `59`), which only works on a six-digit hex. This
 * narrows whatever arrives — including the registry's own values — to that
 * shape, falling back to the brand gold rather than emitting invalid CSS.
 */
export function accentOf(value: string | undefined): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : PALETTE.gold;
}
