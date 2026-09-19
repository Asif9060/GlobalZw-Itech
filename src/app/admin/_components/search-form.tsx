"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Search box for a landing page's inbox.
 *
 * A plain GET form, so a search is a normal navigation: the URL carries the
 * query, the back button works, and nothing here needs JavaScript to function.
 * The clear link is rendered as a link rather than a reset button so the URL is
 * unambiguous.
 */
export default function SearchForm({
  action,
  status,
  query,
}: {
  action: string;
  status?: string;
  query?: string;
}) {
  const [value, setValue] = useState(query ?? "");

  const clearHref = status ? `${action}?status=${encodeURIComponent(status)}` : action;

  return (
    <form className="ad-search" method="get" action={action} role="search">
      {status && <input type="hidden" name="status" value={status} />}
      <input
        className="ad-input"
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search name, email, company, message or ref…"
        aria-label="Search enquiries"
      />
      <button className="ad-btn" type="submit">
        Search
      </button>
      {query ? (
        <Link className="ad-btn ad-btn--sm" href={clearHref}>
          Clear
        </Link>
      ) : null}
    </form>
  );
}
