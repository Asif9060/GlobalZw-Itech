import { CONTENT_WIDTH, FONT_SANS, PALETTE } from "@/lib/email/theme";
import { escapeHtml } from "@/lib/email/render";

/**
 * The document shell every notification is rendered into.
 *
 * It draws the parts that are the same regardless of what happened — the
 * preheader, the accent rule, the brand header, the card, the footer — and
 * leaves one column of `<tr>` rows for the template to fill with the parts that
 * are not.
 *
 * The dark scheme is declared with `color-scheme` rather than defended against
 * with inverted overrides: telling the client the message is already dark is
 * what stops Gmail and Apple Mail auto-inverting it into something the palette
 * was never designed for.
 */

export type DocumentOptions = {
  /** Also used as the `<title>`, which some clients show above the body. */
  subject: string;
  /** The hidden line the inbox shows next to the subject. */
  preheader: string;
  /** The landing page's accent colour; see `accentOf`. */
  accent: string;
  /** Small pill in the header, e.g. "New enquiry". */
  badge: string;
  title: string;
  intro: string;
  /** Composed by the template: a sequence of `<tr>` rows. */
  body: string;
  /** Fine print at the foot of the card. */
  footer: string;
};

/* ── pieces ─────────────────────────────────────────────────────────────── */

/**
 * The inbox preview line. Hidden with the full battery of techniques, because
 * clients pick different ones: `display:none` for most, `mso-hide:all` for
 * Outlook, zero height and opacity for the rest. The filler keeps a client that
 * pulls a preview from the body text from leaking the header instead.
 */
function preheaderRow(text: string): string {
  const filler = "&#847;&zwnj;".repeat(60);

  return (
    `<div style="${[
      "display:none",
      "font-size:1px",
      "line-height:1px",
      "max-height:0",
      "max-width:0",
      "opacity:0",
      "overflow:hidden",
      "mso-hide:all",
      `color:${PALETTE.canvas}`,
    ].join(";")};">` +
    `${escapeHtml(text)}${filler}` +
    `</div>`
  );
}

/**
 * Brand mark, wordmark and event badge. Deliberately identical to the admin
 * portal's sidebar so the message and the portal read as one product.
 */
function header(accent: string, badge: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `style="border-collapse:collapse;width:100%;">` +
    `<tr>` +
    `<td valign="middle" style="vertical-align:middle;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" ` +
    `style="border-collapse:collapse;">` +
    `<tr>` +
    `<td width="38" height="38" align="center" valign="middle" ` +
    `style="${[
      "width:38px",
      "height:38px",
      "border-radius:10px",
      `background:${accent}`,
      `font-family:${FONT_SANS}`,
      "font-size:14px",
      "font-weight:800",
      "line-height:38px",
      "color:#0a0d13",
      "letter-spacing:0.01em",
      "text-align:center",
    ].join(";")};">GS</td>` +
    `<td style="padding-left:12px;vertical-align:middle;">` +
    `<div style="${[
      `font-family:${FONT_SANS}`,
      "font-size:14px",
      "font-weight:700",
      "line-height:1.2",
      `color:${PALETTE.ink}`,
    ].join(";")};">GlobalZwItech</div>` +
    `<div style="${[
      `font-family:${FONT_SANS}`,
      "font-size:11px",
      "line-height:1.4",
      "margin-top:2px",
      `color:${PALETTE.dim}`,
    ].join(";")};">Enquiry notifications</div>` +
    `</td>` +
    `</tr>` +
    `</table>` +
    `</td>` +
    `<td align="right" valign="middle" style="vertical-align:middle;">` +
    `<span style="${[
      "display:inline-block",
      "padding:6px 12px",
      "border-radius:999px",
      `background:${accent}1f`,
      `border:1px solid ${accent}59`,
      `font-family:${FONT_SANS}`,
      "font-size:10.5px",
      "font-weight:700",
      "line-height:1",
      "letter-spacing:0.1em",
      "text-transform:uppercase",
      `color:${accent}`,
      "white-space:nowrap",
    ].join(";")};">${escapeHtml(badge)}</span>` +
    `</td>` +
    `</tr>` +
    `</table>`
  );
}

/** The heading block: eyebrow, title, one line of context. */
function heading(accent: string, title: string, intro: string): string {
  return (
    `<tr><td class="gs-pad" style="padding:30px 32px 0;">` +
    `<h1 class="gs-h1" style="${[
      `font-family:${FONT_SANS}`,
      "font-size:24px",
      "font-weight:700",
      "line-height:1.28",
      "letter-spacing:-0.015em",
      "margin:0",
      `color:${PALETTE.ink}`,
    ].join(";")};">${escapeHtml(title)}</h1>` +
    `<p style="${[
      `font-family:${FONT_SANS}`,
      "font-size:14px",
      "line-height:1.6",
      "margin:9px 0 0",
      `color:${PALETTE.muted}`,
    ].join(";")};">${escapeHtml(intro)}</p>` +
    `</td></tr>`
  );
}

/* ── document ───────────────────────────────────────────────────────────── */

export function emailDocument(options: DocumentOptions): string {
  const { subject, preheader, accent, badge, title, intro, body, footer } = options;

  const mobile = [
    "@media only screen and (max-width:600px){",
    // The card already fits any width (see the comment at the card table), so
    // these are refinements for clients that honour a stylesheet — not the
    // thing the layout depends on.
    `.gs-canvas{padding-left:10px !important;padding-right:10px !important;}`,
    `.gs-pad{padding-left:22px !important;padding-right:22px !important;}`,
    `.gs-h1{font-size:21px !important;}`,
    // A 150px label column eats half a phone's width, so it narrows here while
    // staying fixed — the values must still line up with each other.
    `.gs-fields>tbody>tr>td:first-child{width:112px !important;}`,
    `.gs-meta>tbody>tr>td:first-child{width:92px !important;}`,
    // Headline facts and buttons stack instead of shrinking: two 130px columns
    // of a reference number and a timestamp are unreadable on a phone.
    `.gs-stack>tbody>tr>td{display:block !important;width:100% !important;`,
    `border-right:0 !important;border-bottom:1px solid ${PALETTE.line};}`,
    `.gs-stack>tbody>tr>td:last-child{border-bottom:0 !important;}`,
    `.gs-actions>tbody>tr>td{display:block !important;width:100% !important;`,
    `padding:0 0 10px 0 !important;}`,
    `.gs-actions a{display:block !important;text-align:center;}`,
    "}",
  ].join("");

  return [
    `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">`,
    `<html xmlns="http://www.w3.org/1999/xhtml" lang="en">`,
    `<head>`,
    `<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
    `<meta name="x-apple-disable-message-reformatting" />`,
    `<meta name="color-scheme" content="dark" />`,
    `<meta name="supported-color-schemes" content="dark" />`,
    `<title>${escapeHtml(subject)}</title>`,
    `<!--[if mso]>`,
    `<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>`,
    `<![endif]-->`,
    `<style type="text/css">`,
    `body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}`,
    `table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}`,
    `img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}`,
    `a{text-decoration:none;}`,
    `a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;}`,
    mobile,
    `</style>`,
    `</head>`,
    `<body style="margin:0;padding:0;width:100%;${[
      `background:${PALETTE.canvas}`,
      `font-family:${FONT_SANS}`,
      `color:${PALETTE.ink}`,
      "-webkit-font-smoothing:antialiased",
    ].join(";")};">`,
    preheaderRow(preheader),

    // Outer canvas. `bgcolor` as well as `background` because Outlook trusts the
    // attribute and ignores the declaration.
    //
    // `table-layout:fixed` is load-bearing: under the default `auto` layout a
    // table cell is never narrower than its content, so this one would be pushed
    // out to the card's intrinsic 600px and every phone would clip the right-hand
    // side. Fixed layout sizes the column from the table width instead, which
    // lets the media query below actually shrink the card.
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
      `bgcolor="${PALETTE.canvas}" style="border-collapse:collapse;table-layout:fixed;` +
      `width:100%;background:${PALETTE.canvas};">`,
    `<tr><td class="gs-canvas" align="center" style="padding:26px 12px 34px;">`,

    // Card.
    //
    // `width:100%` with `max-width` rather than a hard `width="600"`: a fixed
    // table width is a *minimum* as well as a maximum, so on a phone it would
    // push past the viewport and clip the right-hand side. Sizing it this way
    // needs no media query, which matters because a client that strips `<style>`
    // would otherwise lose the mobile layout entirely.
    //
    // Outlook is the one client that ignores `max-width`, so the conditional
    // comment pins the card at 600px for it and nothing else.
    `<!--[if mso]>`,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${CONTENT_WIDTH}">`,
    `<tr><td>`,
    `<![endif]-->`,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
      `class="gs-card" ` +
      `style="border-collapse:separate;border-spacing:0;width:100%;max-width:${CONTENT_WIDTH}px;` +
      `background:${PALETTE.panel};border:1px solid ${PALETTE.line};border-radius:14px;">`,

    // Accent rule across the top of the card.
    `<tr><td height="3" style="${[
      "height:3px",
      "font-size:0",
      "line-height:0",
      `background:${accent}`,
      "border-radius:14px 14px 0 0",
    ].join(";")};">&nbsp;</td></tr>`,

    `<tr><td class="gs-pad" style="padding:22px 32px 20px;">${header(accent, badge)}</td></tr>`,
    `<tr><td style="padding:0 32px;">` +
      `<div style="height:1px;line-height:1px;font-size:0;background:${PALETTE.line};">&nbsp;</div>` +
      `</td></tr>`,

    heading(accent, title, intro),

    // Breathes between the prose and the first data block, which is always a
    // bordered inset — without it the reference strip looks glued to the intro.
    `<tr><td style="height:26px;font-size:0;line-height:0;" aria-hidden="true">&nbsp;</td></tr>`,

    body,

    `<tr><td style="height:30px;font-size:0;line-height:0;" aria-hidden="true">&nbsp;</td></tr>`,

    // Card footer
    `<tr><td class="gs-pad" style="padding:16px 32px;background:#0b0f16;border-top:1px solid ${PALETTE.line};` +
      `border-radius:0 0 13px 13px;">` +
      `<div style="${[
        `font-family:${FONT_SANS}`,
        "font-size:11.5px",
        "line-height:1.65",
        `color:${PALETTE.dim}`,
      ].join(";")};">${escapeHtml(footer)}</div>` +
      `</td></tr>`,

    `</table>`,
    // /Card
    `<!--[if mso]>`,
    `</td></tr>`,
    `</table>`,
    `<![endif]-->`,

    `</td></tr>`,
    `</table>`,
    `</body>`,
    `</html>`,
  ].join("\n");
}
