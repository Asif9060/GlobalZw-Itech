import { FONT_MONO, FONT_SANS, PALETTE } from "@/lib/email/theme";

/**
 * HTML building blocks for the notification emails.
 *
 * Everything here returns a `<tr>` that the layout slots into the card's single
 * column, or a fragment that goes inside one. Three rules apply throughout,
 * because an email client is not a browser:
 *
 *   1. Tables, never flex or grid. Outlook has no layout engine worth the name.
 *   2. Inline styles only, written in longhand. The `font` shorthand and CSS
 *      custom properties are stripped or ignored by several clients.
 *   3. Every value that came from a customer is escaped. A message body ends up
 *      inside HTML in somebody's inbox — it must not be able to inject markup.
 */

/* ── escaping ───────────────────────────────────────────────────────────── */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Only the schemes this project actually generates survive. Anything else — a
 * `javascript:` pasted into a form field, say — collapses to `#`, so a value
 * that reached the template unexpectedly cannot become a live link.
 */
export function safeHref(value: string): string {
  const trimmed = value.trim();
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return escapeHtml(trimmed);
  return "#";
}

/** Long values are cut on a word boundary where possible, so nothing reads as broken. */
export function truncate(value: string, max: number): string {
  const flat = value.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Newlines in a customer's message become real breaks; the text is already escaped. */
function withBreaks(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function cx(...parts: string[]): string {
  return parts.join("");
}

/** Type styles reused across blocks, so the rhythm stays consistent. */
const TYPE = {
  eyebrow:
    `font-family:${FONT_SANS};font-size:10.5px;line-height:1.4;font-weight:700;` +
    `letter-spacing:0.14em;text-transform:uppercase;`,
  label:
    `font-family:${FONT_SANS};font-size:10px;line-height:1.5;font-weight:700;` +
    `letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.dim};`,
  value:
    `font-family:${FONT_SANS};font-size:14.5px;line-height:1.55;color:${PALETTE.ink};`,
  body:
    `font-family:${FONT_SANS};font-size:14.5px;line-height:1.65;color:${PALETTE.muted};`,
} as const;

/* ── rows ───────────────────────────────────────────────────────────────── */

/** Vertical space between blocks in the card, as a spacer row. */
export function spacer(height: number): string {
  return (
    `<tr><td style="font-size:0;line-height:0;height:${height}px;" aria-hidden="true">` +
    `&nbsp;</td></tr>`
  );
}

/** A hairline rule across the content column. */
export function rule(): string {
  return (
    `<tr><td style="padding:0 32px;">` +
    `<div style="height:1px;line-height:1px;font-size:0;background:${PALETTE.line};">&nbsp;</div>` +
    `</td></tr>`
  );
}

/**
 * An accent-coloured section label — "CONTACT", "ENQUIRY", "PROVENANCE".
 * `first` drops the hairline that separates it from the block above.
 */export function sectionLabel(label: string, accent: string, first = false): string {
  return (
    `<tr><td style="${cx(
      `padding:${first ? "4px" : "26px"} 32px 10px;`,
      first ? "" : `border-top:1px solid ${PALETTE.line};`,
    )}">` +
    `<div style="${cx(TYPE.eyebrow, `color:${accent};`)}">${escapeHtml(label)}</div>` +
    `</td></tr>`
  );
}

export type FieldEntry = {
  label: string;
  value: string;
  /** Rendered as a link when present and the scheme is one we allow. */
  href?: string;
  /** Renders the value in the monospace stack. */
  mono?: boolean;
};

/** Label column width, shared by every field table so the values line up. */
const LABEL_WIDTH = 150;

/** Narrower, because the provenance block is fine print rather than content. */
const META_LABEL_WIDTH = 108;

/**
 * A label/value definition list.
 *
 * Two columns rather than a `<dl>`: email clients collapse definition lists
 * unpredictably, while a table with an explicit label width survives Outlook,
 * Gmail and Apple Mail identically. Rows after the first carry a hairline so the
 * block reads as a grid without needing an outer border.
 *
 * `table-layout:fixed` is what makes the values line up between sections. Under
 * the default `auto` layout each table sizes its own first column from its
 * longest label, so "Enquiry type" and "Estimated quantity" would put their
 * values at different x positions — visibly ragged when the sections are stacked.
 */
export function fieldTable(entries: FieldEntry[], accent: string): string {
  const rows = entries
    .filter((entry) => entry.value.trim().length > 0)
    .map((entry, index) => {
      const separator = index === 0 ? "" : `border-top:1px solid ${PALETTE.lineSoft};`;
      const valueStyle = cx(
        entry.mono ? `${TYPE.value}font-family:${FONT_MONO};font-size:13.5px;` : TYPE.value,
        "padding:9px 0 9px 16px;vertical-align:top;word-break:break-word;",
        separator,
      );

      const value = entry.href
        ? `<a href="${safeHref(entry.href)}" style="${cx(
            `color:${accent};text-decoration:none;border-bottom:1px solid ${accent}55;`,
          )}">${escapeHtml(entry.value)}</a>`
        : escapeHtml(entry.value);

      return (
        `<tr>` +
        `<td width="${LABEL_WIDTH}" valign="top" style="${cx(
          TYPE.label,
          `padding:9px 0;vertical-align:top;width:${LABEL_WIDTH}px;`,
          separator,
        )}">${escapeHtml(entry.label)}</td>` +
        `<td valign="top" style="${valueStyle}">${value}</td>` +
        `</tr>`
      );
    })
    .join("");

  if (!rows) return "";

  return (
    `<tr><td style="padding:0 32px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `class="gs-fields" ` +
    `style="border-collapse:collapse;table-layout:fixed;width:100%;">${rows}</table>` +
    `</td></tr>`
  );
}

/**
 * The two headline facts of a notification — reference and arrival time — in an
 * inset box near the top, where they are read before anything else.
 *
 * The first cell is set in the monospace stack, because it is the one a reader
 * copies or compares character by character (a reference, an email address). A
 * cell holding a word rather than a value passes `mono: false` to opt out.
 */
export function statStrip(
  cells: Array<{ label: string; value: string; mono?: boolean }>,
  accent: string,
): string {
  const width = `${Math.floor(100 / cells.length)}%`;

  const rendered = cells
    .map((cell, index) => {
      const divider =
        index < cells.length - 1 ? `border-right:1px solid ${PALETTE.line};` : "";
      const mono = cell.mono ?? index === 0;

      return (
        `<td width="${width}" valign="top" style="${cx(
          "padding:15px 18px;vertical-align:top;",
          divider,
        )}">` +
        `<div style="${TYPE.label}">${escapeHtml(cell.label)}</div>` +
        `<div style="${cx(
          "margin-top:6px;",
          mono
            ? `font-family:${FONT_MONO};font-size:18px;font-weight:700;line-height:1.25;letter-spacing:-0.01em;color:${accent};word-break:break-all;`
            : `font-family:${FONT_SANS};font-size:16px;font-weight:600;line-height:1.35;color:${PALETTE.ink};`,
        )}">${escapeHtml(cell.value)}</div>` +
        `</td>`
      );
    })
    .join("");

  return (
    `<tr><td style="padding:0 32px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `class="gs-stack" ` +
    `style="border-collapse:separate;border-spacing:0;width:100%;` +
    `background:${PALETTE.inset};border:1px solid ${PALETTE.line};border-radius:12px;">` +
    `<tr>${rendered}</tr></table>` +
    `</td></tr>`
  );
}

/** A customer's message, set apart with an accent spine. */
export function quoteBlock(text: string, accent: string): string {
  return (
    `<tr><td style="padding:0 32px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `style="border-collapse:separate;border-spacing:0;width:100%;` +
    `background:${PALETTE.inset};border-left:3px solid ${accent};border-radius:0 10px 10px 0;">` +
    `<tr><td style="padding:15px 18px;${cx(
      TYPE.value,
      "line-height:1.68;color:#cdd7e7;",
    )}">${withBreaks(text)}</td></tr>` +
    `</table>` +
    `</td></tr>`
  );
}

export type ButtonSpec = {
  label: string;
  href: string;
  /** Filled with the accent colour. Only the first, most likely action. */
  primary?: boolean;
  accent: string;
};

/**
 * A table of side-by-side buttons.
 *
 * Real anchors with padding rather than `<button>` elements, which Outlook and
 * Gmail both mangle. `mso-padding-alt` keeps Outlook's own spacing model in step
 * with the padding, and the border-radius simply degrades to a square corner
 * there — the only shape change worth accepting for the sake of not shipping VML.
 */
export function buttonRow(buttons: ButtonSpec[]): string {
  const rendered = buttons
    .map((button, index) => {
      const base =
        "display:inline-block;text-decoration:none;border-radius:9px;" +
        "font-family:" + FONT_SANS + ";font-size:14px;font-weight:700;line-height:1;";

      const paint = button.primary
        ? `background:${button.accent};color:#0a0d13;border:1px solid ${button.accent};padding:13px 22px;`
        : `background:${PALETTE.inset};color:${PALETTE.ink};border:1px solid ${PALETTE.line};padding:12px 20px;`;

      const gap = index < buttons.length - 1 ? "padding-right:10px;" : "";

      return (
        `<td align="center" style="${gap}">` +
        `<a href="${safeHref(button.href)}" style="${cx(base, paint)}">${escapeHtml(
          button.label,
        )}</a>` +
        `</td>`
      );
    })
    .join("");

  return (
    `<tr><td style="padding:0 32px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left" ` +
    `class="gs-actions" ` +
    `style="border-collapse:separate;border-spacing:0;">` +
    `<tr>${rendered}</tr></table>` +
    `</td></tr>`
  );
}

/** The provenance lines at the foot of the card: small, dim, one per line. */
export function metaList(entries: FieldEntry[]): string {
  const rendered = entries
    .filter((entry) => entry.value.trim().length > 0)
    .map(
      (entry) =>
        `<tr>` +
        `<td width="${META_LABEL_WIDTH}" valign="top" style="${cx(
          TYPE.label,
          `padding:4px 12px 4px 0;vertical-align:top;font-size:9.5px;width:${META_LABEL_WIDTH}px;`,
        )}">${escapeHtml(entry.label)}</td>` +
        `<td valign="top" style="${cx(
          `font-family:${FONT_SANS};font-size:12px;line-height:1.5;color:${PALETTE.dim};`,
          "padding:4px 0;vertical-align:top;word-break:break-word;",
        )}">${escapeHtml(entry.value)}</td>` +
        `</tr>`,
    )
    .join("");

  if (!rendered) return "";

  return (
    `<tr><td style="padding:0 32px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `class="gs-meta" ` +
    `style="border-collapse:collapse;table-layout:fixed;width:100%;">${rendered}</table>` +
    `</td></tr>`
  );
}
