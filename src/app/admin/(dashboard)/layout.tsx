import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { SITE_SLUGS, type SiteSlug } from "@/lib/sites";
import { signOut } from "../actions";
import AdminNav from "../_components/admin-nav";
import { Banner, Empty } from "../_components/ui";
import { loadAdminSnapshot } from "../_lib/queries";

/**
 * The authenticated half of the admin portal.
 *
 * Everything under `(dashboard)` is rendered behind `requireAdmin()`, which
 * redirects to the sign-in screen when there is no valid session. The login
 * page sits outside this route group, which is why the guard can live here
 * rather than in a proxy — one check in one place, and no way to reach a page
 * in this subtree without passing it.
 *
 * The shell also loads the cross-page snapshot once so the sidebar badges and
 * the storage warning are consistent everywhere.
 */

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  const snapshot = await loadAdminSnapshot();

  if (!snapshot.ready) {
    return (
      <main className="ad-main">
        <Empty
          icon="🔌"
          title="No lead store configured"
          hint={
            <>
              The portal is running in an environment where the local fallback is disabled.
              Set <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{" "}
              <code>SUPABASE_SERVICE_ROLE_KEY</code>, then run{" "}
              <code>supabase/schema.sql</code> in your Supabase project.
            </>
          }
        />
      </main>
    );
  }

  const newCounts = Object.fromEntries(
    SITE_SLUGS.map((site) => [site, snapshot.siteStats[site].new]),
  ) as Record<SiteSlug, number>;

  const totalCounts = Object.fromEntries(
    SITE_SLUGS.map((site) => [site, snapshot.siteStats[site].total]),
  ) as Record<SiteSlug, number>;

  const closedSites = SITE_SLUGS.filter(
    (site) => !snapshot.settings[site].acceptingLeads,
  );

  const storeTone = snapshot.store.kind === "supabase" ? "var(--ad-green)" : "var(--ad-amber)";

  return (
    <div className="ad-shell">
      <aside className="ad-sidebar">
        <Link className="ad-brand" href="/admin">
          <span className="ad-brand__mark" aria-hidden="true">
            GS
          </span>
          <span className="ad-brand__text">
            <span className="ad-brand__name">Global Suntech</span>
            <span className="ad-brand__sub">Control Panel</span>
          </span>
        </Link>

        <AdminNav
          newCounts={newCounts}
          totalCounts={totalCounts}
          closedSites={closedSites}
          subscriberCount={snapshot.subscriberCount}
        />

        <div className="ad-sidebar__foot">
          <div className="ad-storebadge">
            <span className="ad-storebadge__label">Storage</span>
            <span className="ad-storebadge__value">
              <span className="ad-nav__dot" style={{ "--ad-dot": storeTone } as React.CSSProperties} aria-hidden="true" />
              {snapshot.store.label}
            </span>
          </div>

          <form action={signOut}>
            <button className="ad-btn ad-btn--block" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="ad-main">
        {snapshot.store.warning && <Banner tone="warn">{snapshot.store.warning}</Banner>}
        {children}
      </main>
    </div>
  );
}
