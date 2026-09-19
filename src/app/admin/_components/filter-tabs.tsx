import Link from "next/link";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads/types";

/**
 * Status filter for a landing page's inbox, rendered as links.
 *
 * Links rather than buttons because filtering is a navigation, not a mutation:
 * the result is a real URL an operator can bookmark, share, or reload, and it
 * works with JavaScript disabled.
 */

export type StatusFilter = LeadStatus | "all";

function hrefWith(
  basePath: string,
  params: { status?: StatusFilter; q?: string; site?: string },
): string {
  const search = new URLSearchParams();

  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.q) search.set("q", params.q);

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export default function FilterTabs({
  basePath,
  current,
  counts,
  query,
}: {
  basePath: string;
  current: StatusFilter;
  counts: Record<StatusFilter, number>;
  query?: string;
}) {
  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    ...LEAD_STATUSES.map((status) => ({
      key: status as StatusFilter,
      label: status === "in_progress" ? "In progress" : status === "new" ? "New" : "Resolved",
    })),
  ];

  return (
    <nav className="ad-tabs" aria-label="Filter by status">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          className="ad-tab"
          href={hrefWith(basePath, { status: tab.key, q: query })}
          aria-current={current === tab.key ? "page" : undefined}
        >
          {tab.label}
          <span className="ad-tab__count">{counts[tab.key] ?? 0}</span>
        </Link>
      ))}
    </nav>
  );
}
