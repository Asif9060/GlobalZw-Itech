import Link from "next/link";
import { notFound } from "next/navigation";
import { isSiteSlug, LEAD_FIELD_LABELS, requireSite } from "@/lib/sites";
import { isLeadStatus, type LeadStatus } from "@/lib/leads/types";
import { describeStore, getLeadStore } from "@/lib/leads";
import { formatRelative } from "@/lib/format";
import { clearSiteLeadsAction } from "@/app/admin/actions";
import ConfirmButton from "@/app/admin/_components/confirm-button";
import ExportLinks from "@/app/admin/_components/export-links";
import FilterTabs, { type StatusFilter } from "@/app/admin/_components/filter-tabs";
import LeadCard from "@/app/admin/_components/lead-card";
import SearchForm from "@/app/admin/_components/search-form";
import { Banner, Empty, PageHeading, Stat } from "@/app/admin/_components/ui";
import { loadSiteLeads } from "@/app/admin/_lib/queries";

/**
 * Per-landing-page enquiry section.
 *
 * Each of the five pages gets one of these, and it is the section an operator
 * lives in: filter by status, search, read, reply, move the enquiry along, or
 * export what is on screen. The page also states which form on the live site
 * feeds it, so the link between the section and the landing page is explicit
 * rather than something you have to remember.
 */

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SiteSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ site: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { site: rawSite } = await params;
  if (!isSiteSlug(rawSite)) notFound();

  const site = requireSite(rawSite);

  const query = await searchParams;
  const rawStatus = first(query.status);
  const status: StatusFilter = isLeadStatus(rawStatus) ? (rawStatus as LeadStatus) : "all";
  const search = first(query.q)?.slice(0, 80)?.trim() || undefined;

  const leads = await loadSiteLeads(site.slug, {
    status: status === "all" ? undefined : status,
    search,
  });

  // Whether the store is configured decides what an empty list means, so the
  // empty state can tell the operator which situation they are looking at.
  const configured = describeStore().kind !== "unconfigured";
  const store = configured ? getLeadStore() : null;
  const stats = store ? await store.stats(site.slug) : null;
  const accepting = store ? (await store.getSiteSettings())[site.slug].acceptingLeads : true;

  const tabCounts: Record<StatusFilter, number> = {
    all: stats?.total ?? 0,
    new: stats?.new ?? 0,
    in_progress: stats?.inProgress ?? 0,
    resolved: stats?.resolved ?? 0,
  };

  const basePath = `/admin/sites/${site.slug}`;
  const filtered = status !== "all" || Boolean(search);

  return (
    <>
      <PageHeading
        eyebrow={`Landing page · ${site.name}`}
        title={site.brand}
        subtitle={
          <>
            {site.summary}. Enquiries from{" "}
            <a className="ad-live" href={site.path} target="_blank" rel="noreferrer">
              {site.path} ↗
            </a>{" "}
            land in this section.
          </>
        }
        actions={
          <>
            <ExportLinks site={site.slug} status={status} query={search} label={`${site.name} enquiries`} />
            <Link className="ad-btn" href="/admin/settings">
              Site controls
            </Link>
          </>
        }
      />

      {!accepting && (
        <Banner tone="danger">
          <strong>This page is not accepting new enquiries.</strong> The form on{" "}
          {site.path} still submits, but the API turns it away with a message asking the
          visitor to email instead. Turn it back on from{" "}
          <Link href="/admin/settings" style={{ color: "inherit", textDecoration: "underline" }}>
            Site controls
          </Link>
          .
        </Banner>
      )}

      <section aria-label={`${site.name} totals`}>
        <div className="ad-stats">
          <Stat label="Awaiting action" value={tabCounts.new} accent="var(--ad-gold)" />
          <Stat label="In progress" value={tabCounts.in_progress} accent="var(--ad-blue)" />
          <Stat label="Resolved" value={tabCounts.resolved} accent="var(--ad-green)" />
          <Stat label="Received today" value={stats?.today ?? 0} accent={site.accent} />
          <Stat
            label="All enquiries"
            value={tabCounts.all}
            hint={stats?.lastLeadAt ? `Last ${formatRelative(stats.lastLeadAt)}` : "No enquiries yet"}
          />
        </div>
      </section>

      <div className="ad-toolbar">
        <FilterTabs basePath={basePath} current={status} counts={tabCounts} query={search} />
        <SearchForm action={basePath} status={status === "all" ? undefined : status} query={search} />
      </div>

      {leads.length === 0 ? (
        <Empty
          title={filtered ? "No enquiries match this filter" : `No enquiries from ${site.brand} yet`}
          hint={
            filtered ? (
              <Link href={basePath} style={{ color: "var(--ad-gold)" }}>
                Clear the filter to see all {tabCounts.all} enquiries from this page.
              </Link>
            ) : (
              <>
                When a visitor submits <code>#{site.formId}</code> on {site.path}, the
                enquiry appears here. This page collects:{" "}
                {site.fields.map((field) => LEAD_FIELD_LABELS[field].toLowerCase()).join(", ")}.
              </>
            )
          }
        />
      ) : (
        <div className="ad-leads">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}

      {leads.length > 0 && (
        <div className="ad-footnote">
          Showing {leads.length}
          {tabCounts.all > leads.length ? ` of ${tabCounts.all}` : ""} enquiry
          {leads.length === 1 ? "" : "s"} from {site.name}
          {search ? ` matching “${search}”` : ""}.
          <div className="ad-row" style={{ marginTop: 14 }}>
            <form action={clearSiteLeadsAction}>
              <input type="hidden" name="site" value={site.slug} />
              <ConfirmButton
                message={`Delete all ${tabCounts.all} enquiries from ${site.brand}? This cannot be undone. Export them first if you need a copy.`}
              >
                🗑 Delete all {site.name} enquiries
              </ConfirmButton>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
