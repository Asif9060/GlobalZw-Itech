import Link from "next/link";
import { LEAD_FIELD_LABELS, SITES } from "@/lib/sites";
import { formatRelative } from "@/lib/format";
import { describeStore } from "@/lib/leads";
import { setSiteAcceptingAction } from "@/app/admin/actions";
import { Banner, OpenClosedPill, PageHeading } from "@/app/admin/_components/ui";
import { defaultSettings, loadAdminSnapshot } from "@/app/admin/_lib/queries";

/**
 * Site controls.
 *
 * One switch per landing page: whether its enquiry form is open. Pausing a page
 * does not remove the form — the API rejects the submission with an explanation
 * and asks the visitor to email instead, which is what you want during a
 * maintenance window or a shortage of engineers to work the leads.
 *
 * The forms here are plain HTML form posts with a Save button: no client
 * JavaScript, because a switch that changes customer-facing behaviour should be
 * deliberate rather than something that fires the moment the pointer lands on
 * it.
 */

export const metadata = { title: "Site controls" };

export default async function SiteControlsPage() {
  const configured = describeStore().kind !== "unconfigured";
  const snapshot = configured ? await loadAdminSnapshot() : null;
  const settings = snapshot?.settings ?? defaultSettings();

  const closed = SITES.filter((site) => !settings[site.slug].acceptingLeads);

  return (
    <>
      <PageHeading
        eyebrow="Settings"
        title="Site controls"
        subtitle="Switches that apply to the live landing pages. Changes take effect immediately — the enquiry API reads these settings on every submission."
      />

      {!configured && (
        <Banner tone="warn">
          No lead store is configured, so these switches cannot be saved yet. Set the
          Supabase environment variables first.
        </Banner>
      )}

      {closed.length > 0 && (
        <Banner tone="danger">
          <strong>
            {closed.length} page{closed.length === 1 ? "" : "s"} not accepting enquiries:
          </strong>{" "}
          {closed.map((site) => site.name).join(", ")}. Visitors can still submit those forms,
          but the submission is refused with a message asking them to email instead.
        </Banner>
      )}

      <div className="ad-panel">
        <div className="ad-panel__head">
          <div>
            <h2 className="ad-panel__title">Enquiry intake</h2>
            <p className="ad-panel__hint">
              Per landing page. Untick to close a form, then save.
            </p>
          </div>
        </div>

        {SITES.map((site) => {
          const setting = settings[site.slug];

          return (
            <div className="ad-setting" key={site.slug}>
              <div className="ad-setting__main">
                <div className="ad-setting__name">
                  <span
                    className="ad-nav__dot"
                    style={{ "--ad-dot": site.accent } as React.CSSProperties}
                    aria-hidden="true"
                  />
                  {site.brand}
                  <Link className="ad-copy" href={`/admin/sites/${site.slug}`}>
                    {snapshot?.siteStats[site.slug].total ?? 0} enquiries
                  </Link>
                </div>
                <div className="ad-setting__desc">
                  <strong>{site.name}</strong> ·{" "}
                  <a className="ad-live" href={site.path} target="_blank" rel="noreferrer">
                    {site.path} ↗
                  </a>{" "}
                  · form <code>#{site.formId}</code> · requires{" "}
                  {site.required.map((field) => LEAD_FIELD_LABELS[field].toLowerCase()).join(", ")}
                  {setting.updatedAt && <> · changed {formatRelative(setting.updatedAt)}</>}
                </div>
              </div>

              <form className="ad-setting__side" action={setSiteAcceptingAction}>
                <input type="hidden" name="site" value={site.slug} />
                <OpenClosedPill accepting={setting.acceptingLeads} />
                <label className="ad-toggle">
                  <input
                    type="checkbox"
                    name="accepting"
                    defaultChecked={setting.acceptingLeads}
                    disabled={!configured}
                  />
                  <span className="ad-toggle__track" aria-hidden="true" />
                  <span>Accept enquiries</span>
                </label>
                <button className="ad-btn ad-btn--sm" type="submit" disabled={!configured}>
                  Save
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <div className="ad-grid-2 ad-mt">
        <div className="ad-panel">
          <div className="ad-panel__head">
            <h2 className="ad-panel__title">Storage</h2>
          </div>
          <div className="ad-panel__body">
            {snapshot && (
              <Banner tone={snapshot.store.kind === "supabase" ? "info" : "warn"}>
                Enquiries are currently stored in <strong>{snapshot.store.label}</strong>.
                {snapshot.store.warning ? ` ${snapshot.store.warning}` : ""}
              </Banner>
            )}
            <p className="ad-subtitle">
              The server reads <code>SUPABASE_SERVICE_ROLE_KEY</code> and writes through Row
              Level Security, so the anon key in a browser can never read customer data. Apply{" "}
              <code>supabase/schema.sql</code> before switching over.
            </p>
          </div>
        </div>

        <div className="ad-panel">
          <div className="ad-panel__head">
            <h2 className="ad-panel__title">How submissions arrive</h2>
          </div>
          <div className="ad-panel__body">
            <p className="ad-subtitle">
              Every landing page posts to <code>POST /api/leads</code> with a canonical payload.
              The API validates and normalises it, checks the switch above, then stores it. The
              public endpoints are:
            </p>
            <ul className="ad-footnote" style={{ marginTop: 12 }}>
              <li>
                <code>POST /api/leads</code> — enquiries, rate limited to 8 per address per 10
                minutes.
              </li>
              <li>
                <code>POST /api/subscribe</code> — newsletter signups.
              </li>
              <li>
                <code>GET /api/health</code> — connection and schema check.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
