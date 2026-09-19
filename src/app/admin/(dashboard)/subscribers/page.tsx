import Link from "next/link";
import { SITES } from "@/lib/sites";
import { formatDateTime, formatRelative } from "@/lib/format";
import { describeStore } from "@/lib/leads";
import { deleteSubscriberAction } from "@/app/admin/actions";
import ConfirmButton from "@/app/admin/_components/confirm-button";
import CopyButton from "@/app/admin/_components/copy-button";
import { Empty, PageHeading, Stat } from "@/app/admin/_components/ui";
import { loadSubscribers } from "@/app/admin/_lib/queries";

/**
 * Newsletter audience.
 *
 * Kept apart from the enquiry sections on purpose: a subscriber has not asked
 * for a quote, so mixing them into a landing page's inbox would bury the leads
 * that need a reply.
 */

export default async function SubscribersPage() {
  const subscribers = await loadSubscribers();
  const configured = describeStore().kind !== "unconfigured";

  if (!configured) {
    return (
      <>
        <PageHeading eyebrow="Audience" title="Newsletter" />
        <Empty
          icon="🔌"
          title="No lead store configured"
          hint="Set the Supabase environment variables to see newsletter signups."
        />
      </>
    );
  }

  const perSite = new Map<string, number>();
  for (const subscriber of subscribers) {
    perSite.set(subscriber.site, (perSite.get(subscriber.site) ?? 0) + 1);
  }

  const lastSignup = subscribers[0]?.createdAt ?? null;

  return (
    <>
      <PageHeading
        eyebrow="Audience"
        title="Newsletter signups"
        subtitle={
          <>
            Footer signups from the landing pages. These are{" "}
            {subscribers.length} address{subscribers.length === 1 ? "" : "es"}
            {lastSignup ? `, the most recent ${formatRelative(lastSignup)}` : ""}.
          </>
        }
        actions={
          <a className="ad-btn ad-btn--sm" href="/admin/export/subscribers?format=csv">
            ⬇ CSV
          </a>
        }
      />

      <div className="ad-stats">
        <Stat label="Total subscribers" value={subscribers.length} accent="var(--ad-amber)" />
        {SITES.filter((site) => (perSite.get(site.slug) ?? 0) > 0).map((site) => (
          <Stat
            key={site.slug}
            label={site.name}
            value={perSite.get(site.slug) ?? 0}
            accent={site.accent}
          />
        ))}
      </div>

      {subscribers.length === 0 ? (
        <Empty
          title="No signups yet"
          hint="The newsletter forms in the footer of the main site, Traffic Solutions and Solar Solutions write here."
        />
      ) : (
        <div className="ad-panel">
          <div className="ad-tablewrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">Landing page</th>
                  <th scope="col">Signed up</th>
                  <th scope="col">Source</th>
                  <th scope="col">
                    <span className="ad-copy">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => {
                  const site = SITES.find((entry) => entry.slug === subscriber.site);
                  return (
                    <tr key={subscriber.id}>
                      <td>
                        <a href={`mailto:${subscriber.email}`}>{subscriber.email}</a>
                      </td>
                      <td>
                        <Link
                          href={`/admin/sites/${subscriber.site}`}
                          style={{ color: site?.accent }}
                        >
                          {site?.name ?? subscriber.site}
                        </Link>
                      </td>
                      <td title={formatDateTime(subscriber.createdAt)}>
                        {formatRelative(subscriber.createdAt)}
                      </td>
                      <td className="ad-copy">{subscriber.sourcePath ?? "—"}</td>
                      <td>
                        <div className="ad-row">
                          <CopyButton value={subscriber.email} label="Copy" />
                          <form action={deleteSubscriberAction}>
                            <input type="hidden" name="id" value={subscriber.id} />
                            <ConfirmButton
                              message={`Remove ${subscriber.email} from the newsletter list?`}
                            >
                              Remove
                            </ConfirmButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="ad-footnote">
        Showing up to 500 of {subscribers.length}. Use the CSV download for the full list.
      </p>
    </>
  );
}
