import { getSite } from "@/lib/sites";
import { LEAD_STATUS_LABEL, type Lead } from "@/lib/leads/types";
import { toCsv } from "@/lib/csv";

/**
 * Export shape for enquiries.
 *
 * Deliberately its own thing rather than a dump of the `Lead` type: an operator
 * opening this in a spreadsheet wants readable column headings and the landing
 * page named, not `enquiryType` and a slug.
 */

export const LEAD_EXPORT_HEADERS = [
  "Reference",
  "Received",
  "Landing page",
  "Status",
  "Name",
  "Email",
  "Phone",
  "Company",
  "Country",
  "City",
  "Site location",
  "Enquiry type",
  "System type",
  "Quantity",
  "Message",
  "Extra answers",
  "Source path",
  "Referrer",
] as const;

function detailSummary(lead: Lead): string {
  const entries = Object.entries(lead.details);
  if (entries.length === 0) return "";
  return entries.map(([key, value]) => `${key}: ${value}`).join(" | ");
}

export function leadToExportRow(lead: Lead): (string | null)[] {
  const site = getSite(lead.site);

  return [
    lead.ref,
    lead.createdAt,
    site ? `${site.name} (${site.brand})` : lead.site,
    LEAD_STATUS_LABEL[lead.status],
    lead.name,
    lead.email,
    lead.phone,
    lead.company,
    lead.country,
    lead.city,
    lead.location,
    lead.enquiryType,
    lead.systemType,
    lead.quantity,
    lead.message,
    detailSummary(lead),
    lead.sourcePath,
    lead.referrer,
  ];
}

export function leadsToCsv(leads: Lead[]): string {
  return toCsv([[...LEAD_EXPORT_HEADERS], ...leads.map(leadToExportRow)]);
}

/**
 * JSON export keeps the full record, including `details` as a real object and
 * the envelope fields an integration might need.
 */
export function leadsToJson(leads: Lead[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      count: leads.length,
      leads,
    },
    null,
    2,
  );
}

/** `globalzwitech-traffic-solutions-leads-2026-09-19.csv` */
export function exportFilename(scope: string, extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `globalzwitech-${scope}-leads-${stamp}.${extension}`;
}
