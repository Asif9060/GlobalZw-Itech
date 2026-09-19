import Link from "next/link";
import { requireSite } from "@/lib/sites";
import type { Lead } from "@/lib/leads/types";
import { formatDateTime, formatRelative } from "@/lib/format";
import { deleteLeadAction } from "../actions";
import ConfirmButton from "./confirm-button";
import CopyButton from "./copy-button";
import StatusSelect from "./status-select";
import { StatusPill } from "./ui";

/**
 * One enquiry, rendered in full.
 *
 * A Server Component, so the message body, the answers and the provenance are
 * all in the initial HTML — nothing about a customer's enquiry requires
 * JavaScript to read. The three interactive pieces (status, copy, delete) are
 * small Client Components sitting inside it.
 */

function place(lead: Lead): string | null {
  const parts = [lead.city, lead.country].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return lead.location;
}

export default function LeadCard({
  lead,
  showSite = false,
}: {
  lead: Lead;
  showSite?: boolean;
}) {
  const site = requireSite(lead.site);
  const where = place(lead);
  const detailEntries = Object.entries(lead.details);

  return (
    <article
      className={`ad-lead${lead.status === "new" ? " ad-lead--new" : ""}`}
      style={{ "--ad-accent": site.accent } as React.CSSProperties}
    >
      <header className="ad-lead__head">
        <div className="ad-lead__who">
          <h3 className="ad-lead__name">
            {lead.name}
            <span className="ad-lead__ref">{lead.ref}</span>
          </h3>

          <div className="ad-lead__meta">
            <a href={`mailto:${lead.email}`}>✉ {lead.email}</a>
            {lead.phone && <a href={`tel:${lead.phone}`}>☎ {lead.phone}</a>}
            {lead.company && <span>🏢 {lead.company}</span>}
            {where && <span>📍 {where}</span>}
            {showSite && (
              <Link href={`/admin/sites/${site.slug}`} style={{ color: site.accent }}>
                {site.brand}
              </Link>
            )}
          </div>
        </div>

        <StatusPill status={lead.status} />
      </header>

      {(lead.enquiryType || lead.systemType || lead.quantity) && (
        <div className="ad-lead__tags">
          {lead.enquiryType && <span className="ad-tag ad-tag--accent">{lead.enquiryType}</span>}
          {lead.systemType && <span className="ad-tag ad-tag--green">{lead.systemType}</span>}
          {lead.quantity && <span className="ad-tag">Qty: {lead.quantity}</span>}
        </div>
      )}

      {lead.message && <div className="ad-lead__message">{lead.message}</div>}

      {detailEntries.length > 0 && (
        <dl className="ad-lead__details">
          {detailEntries.map(([key, value]) => (
            <div key={key}>
              <dt className="ad-detail__key">{key.replace(/_/g, " ")}</dt>
              <dd className="ad-detail__value">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <footer className="ad-lead__foot">
        <div className="ad-lead__actions">
          <StatusSelect id={lead.id} status={lead.status} />

          <a className="ad-btn ad-btn--sm" href={`mailto:${lead.email}?subject=Re: ${lead.ref}`}>
            ✉ Reply
          </a>

          <CopyButton value={lead.email} label="Copy email" />

          <form action={deleteLeadAction}>
            <input type="hidden" name="id" value={lead.id} />
            <ConfirmButton
              message={`Delete enquiry ${lead.ref} from ${lead.name}? This cannot be undone.`}
            >
              Delete
            </ConfirmButton>
          </form>
        </div>

        <div className="ad-lead__when">
          <span title={formatDateTime(lead.createdAt)}>{formatRelative(lead.createdAt)}</span>
          {" · "}
          <span>{formatDateTime(lead.createdAt)}</span>
          {lead.sourcePath && (
            <>
              {" · "}
              <span className="ad-copy">from {lead.sourcePath}</span>
            </>
          )}
        </div>
      </footer>
    </article>
  );
}
