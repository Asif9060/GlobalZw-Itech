import Link from "next/link";
import { SITES } from "@/lib/sites";
import { formatRelative } from "@/lib/format";
import ExportLinks from "../_components/export-links";
import LeadCard from "../_components/lead-card";
import { OpenClosedPill, Empty, PageHeading, Stat } from "../_components/ui";
import { loadAdminSnapshot, loadRecentLeads } from "../_lib/queries";

/**
 * Admin dashboard: the whole group at a glance.
 *
 * This is a Server Component, so the counters and the enquiry list are rendered
 * on the server for each request — there is no loading spinner and no
 * client-side fetch. Each landing page gets its own card here and its own
 * dedicated section under /admin/sites/[site], which is where its enquiries are
 * actually worked.
 */

export default async function AdminOverviewPage() {
  const [snapshot, recent] = await Promise.all([loadAdminSnapshot(), loadRecentLeads(8)]);

  const { overall, siteStats, settings, store, subscriberCount } = snapshot;

  return (
    <>
      <PageHeading
        eyebrow="Control panel"
        title="Every enquiry, in one place"
        subtitle={
          <>
            Five landing pages feed this portal. New submissions appear here
            automatically — open a page&rsquo;s section to work through its enquiries.
            {overall.lastLeadAt && (
              <> Last enquiry received {formatRelative(overall.lastLeadAt)}.</>
            )}
          </>
        }
        actions={
          <>
            <ExportLinks label="All enquiries" />
            <Link className="ad-btn" href="/admin/settings">
              Site controls
            </Link>
          </>
        }
      />

      <section aria-label="Totals">
        <div className="ad-stats">
          <Stat label="Received today" value={overall.today} accent="var(--ad-gold)" />
          <Stat label="Awaiting action" value={overall.new} accent="var(--ad-red)" hint="Status: new" />
          <Stat label="In progress" value={overall.inProgress} accent="var(--ad-blue)" />
          <Stat label="Resolved" value={overall.resolved} accent="var(--ad-green)" />
          <Stat label="All enquiries" value={overall.total} accent="var(--ad-muted)" />
          <Stat
            label="Newsletter signups"
            value={subscriberCount}
            accent="var(--ad-amber)"
            href="/admin/subscribers"
          />
        </div>
      </section>

      <section aria-label="Landing pages">
        <div className="ad-toolbar">
          <div>
            <h2 className="ad-panel__title">Landing pages</h2>
            <p className="ad-panel__hint">
              Each page keeps its own inbox and its own section in the sidebar.
            </p>
          </div>
        </div>

        <div className="ad-sites">
          {SITES.map((site) => {
            const stats = siteStats[site.slug];
            const accepting = settings[site.slug].acceptingLeads;

            return (
              <Link
                key={site.slug}
                className="ad-sitecard"
                href={`/admin/sites/${site.slug}`}
                style={{ "--ad-accent": site.accent } as React.CSSProperties}
              >
                <div className="ad-sitecard__head">
                  <div>
                    <div className="ad-sitecard__brand">
                      <span className="ad-sitecard__dot" aria-hidden="true" />
                      {site.brand}
                    </div>
                    <div className="ad-sitecard__path">{site.path}</div>
                  </div>
                  <OpenClosedPill accepting={accepting} />
                </div>

                <p className="ad-sitecard__summary">{site.summary}</p>

                <div className="ad-sitecard__stats">
                  <div>
                    <div className="ad-mini__value">{stats.total}</div>
                    <div className="ad-mini__label">Total</div>
                  </div>
                  <div>
                    <div className="ad-mini__value" style={{ color: stats.new > 0 ? "var(--ad-gold)" : undefined }}>
                      {stats.new}
                    </div>
                    <div className="ad-mini__label">New</div>
                  </div>
                  <div>
                    <div className="ad-mini__value" style={{ fontSize: 13 }}>
                      {formatRelative(stats.lastLeadAt)}
                    </div>
                    <div className="ad-mini__label">Last enquiry</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="ad-mt" aria-label="Latest enquiries">
        <div className="ad-toolbar">
          <div>
            <h2 className="ad-panel__title">Latest enquiries</h2>
            <p className="ad-panel__hint">The eight most recent submissions across every page.</p>
          </div>
          <ExportLinks label="All enquiries" />
        </div>

        {recent.length === 0 ? (
          <Empty
            title="No enquiries yet"
            hint={
              store.kind === "local"
                ? "Submissions from any landing page will appear here. The portal is currently using the local fallback store, so nothing is being written to Supabase yet."
                : "Submissions from any landing page will appear here as soon as a visitor sends one."
            }
          />
        ) : (
          <div className="ad-leads">
            {recent.map((lead) => (
              <LeadCard key={lead.id} lead={lead} showSite />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
