"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITES, type SiteSlug } from "@/lib/sites";

/**
 * Sidebar navigation for the admin portal.
 *
 * A Client Component purely for `usePathname()`: the active section has to be
 * derived from the current URL, and a Server Component has no access to it. The
 * counts and flags are computed on the server and passed down, so this file
 * holds no data logic.
 */

export type AdminNavProps = {
  /** Unresolved ("new") enquiries per landing page — drives the badges. */
  newCounts: Record<SiteSlug, number>;
  /** Total enquiries per landing page. */
  totalCounts: Record<SiteSlug, number>;
  /** Pages whose form has been switched off. */
  closedSites: SiteSlug[];
  subscriberCount: number;
};

export default function AdminNav({
  newCounts,
  totalCounts,
  closedSites,
  subscriberCount,
}: AdminNavProps) {
  const pathname = usePathname();
  const closed = new Set(closedSites);

  return (
    <>
      <div className="ad-navgroup">
        <div className="ad-navgroup__title">Overview</div>
        <nav className="ad-nav">
          <Link
            className="ad-nav__link"
            href="/admin"
            aria-current={pathname === "/admin" ? "page" : undefined}
          >
            <span className="ad-nav__dot" aria-hidden="true" />
            <span className="ad-nav__label">Dashboard</span>
          </Link>
        </nav>
      </div>

      <div className="ad-navgroup">
        <div className="ad-navgroup__title">Landing pages</div>
        <nav className="ad-nav">
          {SITES.map((site) => {
            const href = `/admin/sites/${site.slug}`;
            const active = pathname === href;
            const pending = newCounts[site.slug] ?? 0;

            return (
              <Link
                key={site.slug}
                className="ad-nav__link"
                href={href}
                aria-current={active ? "page" : undefined}
                title={`${site.brand} — ${site.summary}`}
              >
                <span
                  className="ad-nav__dot"
                  style={{ "--ad-dot": closed.has(site.slug) ? "#ff6b6b" : site.accent } as React.CSSProperties}
                  aria-hidden="true"
                />
                <span className="ad-nav__label">{site.name}</span>
                <span
                  className={`ad-nav__count${pending > 0 ? " ad-nav__count--attention" : ""}`}
                  title={`${totalCounts[site.slug] ?? 0} total, ${pending} new`}
                >
                  {pending > 0 ? pending : totalCounts[site.slug] ?? 0}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="ad-navgroup">
        <div className="ad-navgroup__title">Audience</div>
        <nav className="ad-nav">
          <Link
            className="ad-nav__link"
            href="/admin/subscribers"
            aria-current={pathname === "/admin/subscribers" ? "page" : undefined}
          >
            <span className="ad-nav__dot" aria-hidden="true" />
            <span className="ad-nav__label">Newsletter</span>
            <span className="ad-nav__count">{subscriberCount}</span>
          </Link>
          <Link
            className="ad-nav__link"
            href="/admin/settings"
            aria-current={pathname === "/admin/settings" ? "page" : undefined}
          >
            <span className="ad-nav__dot" aria-hidden="true" />
            <span className="ad-nav__label">Site controls</span>
            {closedSites.length > 0 && (
              <span className="ad-nav__count ad-nav__count--attention" title="Pages not accepting enquiries">
                {closedSites.length} off
              </span>
            )}
          </Link>
        </nav>
      </div>
    </>
  );
}
