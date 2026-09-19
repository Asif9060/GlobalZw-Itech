/**
 * CSV serialisation for the admin export.
 *
 * Two concerns beyond simply joining commas:
 *
 *  1. Quoting — any value containing a comma, quote or newline has to be
 *     wrapped and its quotes doubled, otherwise a multi-line project brief
 *     silently corrupts every row after it.
 *  2. Formula injection — a spreadsheet treats a leading `=`, `+`, `-` or `@`
 *     as a formula. A customer could put `=HYPERLINK(...)` in a message field
 *     and have it execute when an operator opens the export. Prefixing those
 *     cells with an apostrophe keeps the text inert.
 */

const RISKY_PREFIX = /^[=+\-@\t\r]/;

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";

  let text = typeof value === "string" ? value : String(value);
  if (RISKY_PREFIX.test(text)) text = `'${text}`;

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: unknown[][]): string {
  // CRLF and a trailing newline, per RFC 4180 and Excel's expectations.
  return `${rows.map((row) => row.map(cell).join(",")).join("\r\n")}\r\n`;
}
