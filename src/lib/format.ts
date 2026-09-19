/**
 * Date formatting for the admin portal.
 *
 * All of this runs during server rendering, so there is no hydration boundary
 * to worry about: the string in the HTML is the string the operator sees. Times
 * are rendered in the server's timezone, which is the deployment's timezone.
 */

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_ONLY = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const TIME_ONLY = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(iso: string | null | undefined): string {
  const date = parse(iso);
  return date ? DATE_TIME.format(date) : "—";
}

export function formatDate(iso: string | null | undefined): string {
  const date = parse(iso);
  return date ? DATE_ONLY.format(date) : "—";
}

export function formatTime(iso: string | null | undefined): string {
  const date = parse(iso);
  return date ? TIME_ONLY.format(date) : "—";
}

/** "3 min ago" — precision is capped at weeks, past which the date is clearer. */
export function formatRelative(iso: string | null | undefined): string {
  const date = parse(iso);
  if (!date) return "never";

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} wk${weeks === 1 ? "" : "s"} ago`;

  return DATE_ONLY.format(date);
}
