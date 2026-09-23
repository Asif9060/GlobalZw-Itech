/**
 * Plain-text counterparts for the notification emails.
 *
 * This is not boilerplate. A message with no `text/plain` part scores worse with
 * spam filters, is unreadable in a terminal client, and — for an operator who
 * reads enquiries on a phone's lock screen — is often the version that actually
 * gets read first.
 *
 * The format is deliberately flat: an unadorned heading, then label/value pairs
 * aligned to a fixed column. That stays legible in a monospace mail client and
 * in a notification preview that collapses whitespace.
 */

/**
 * Wide enough for "Landing page:" and "Client hash:", the longest labels the
 * templates use. Longer ones simply push their value out by the difference
 * rather than truncating it.
 */
const LABEL_WIDTH = 14;

/** A titled block. Blocks are joined with a blank line by the template. */
export function plainBlock(heading: string, body: string): string {
  const trimmed = body.replace(/\n+$/, "");
  return trimmed ? `${heading}\n${trimmed}` : heading;
}

/** `  Name        Jane Doe` — the label padded to a stable column. */
export function plainField(label: string, value: string, indent = 2): string {
  const pad = " ".repeat(indent);
  const key = `${label}:`;
  // A label longer than the column gets one space rather than none, so the
  // value is never welded to its colon.
  const heading = key.length >= LABEL_WIDTH ? `${key} ` : key.padEnd(LABEL_WIDTH);
  // A multi-line value continues under its own first character rather than back
  // at the label column, where it would read as several different fields.
  const continuation = `\n${" ".repeat(indent + heading.length)}`;
  return `${pad}${heading}${value.replace(/\n/g, continuation)}\n`;
}

/** A dim horizontal rule, for setting free text apart from its heading. */
export function plainRule(): string {
  return `${"-".repeat(46)}\n`;
}

/** Aligned label/value pairs, skipping anything the enquiry did not supply. */
export function plainFields(
  entries: Array<{ label: string; value: string | null | undefined }>,
): string {
  return entries
    .filter(
      (entry): entry is { label: string; value: string } =>
        typeof entry.value === "string" && entry.value.trim().length > 0,
    )
    .map((entry) => plainField(entry.label, entry.value.trim()))
    .join("");
}
