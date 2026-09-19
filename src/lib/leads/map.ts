import { isSiteSlug, type SiteSlug } from "@/lib/sites";
import { isLeadStatus, type Lead, type LeadStatus, type Subscriber } from "@/lib/leads/types";

/**
 * Translation between the database's snake_case rows and the camelCase objects
 * the rest of the app uses. Keeping it in one file means a schema change is a
 * one-file change, and it is the boundary where raw rows stop being passed
 * around (see the Data Access Layer notes in the Next.js data-security guide).
 */

export type LeadRow = {
  id: string;
  ref: string;
  site: string;
  form_id: string | null;
  status: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  city: string | null;
  location: string | null;
  enquiry_type: string | null;
  system_type: string | null;
  quantity: string | null;
  message: string | null;
  details: unknown;
  source_path: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriberRow = {
  id: string;
  email: string;
  site: string;
  source_path: string | null;
  created_at: string;
};

export type SiteSettingRow = {
  site: string;
  accepting_leads: boolean;
  updated_at: string | null;
};

/**
 * `leads.site` carries a CHECK constraint limited to the known slugs, so a
 * value that fails this guard means the constraint was dropped or a row was
 * written by hand. Coercing instead of throwing keeps one bad row from taking
 * down the whole admin dashboard.
 */
function toSiteSlug(value: unknown): SiteSlug {
  return isSiteSlug(value) ? value : "landing";
}

function toStatus(value: unknown): LeadStatus {
  return isLeadStatus(value) ? value : "new";
}

function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** `details` is jsonb, so PostgREST may hand back an object or a JSON string. */
function toDetails(value: unknown): Record<string, string> {
  let source: unknown = value;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return {};
    }
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};

  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(source as Record<string, unknown>)) {
    if (raw === null || raw === undefined) continue;
    out[key] = typeof raw === "string" ? raw : String(raw);
  }
  return out;
}

export function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    ref: row.ref,
    site: toSiteSlug(row.site),
    formId: toText(row.form_id),
    status: toStatus(row.status),
    name: row.name,
    email: row.email,
    phone: toText(row.phone),
    company: toText(row.company),
    country: toText(row.country),
    city: toText(row.city),
    location: toText(row.location),
    enquiryType: toText(row.enquiry_type),
    systemType: toText(row.system_type),
    quantity: toText(row.quantity),
    message: toText(row.message),
    details: toDetails(row.details),
    sourcePath: toText(row.source_path),
    referrer: toText(row.referrer),
    userAgent: toText(row.user_agent),
    ipHash: toText(row.ip_hash),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSubscriber(row: SubscriberRow): Subscriber {
  return {
    id: row.id,
    email: row.email,
    site: toSiteSlug(row.site),
    sourcePath: toText(row.source_path),
    createdAt: row.created_at,
  };
}

/** Columns selected from `leads` — spelled out so a `select *` never leaks. */
export const LEAD_COLUMNS =
  "id,ref,site,form_id,status,name,email,phone,company,country,city,location," +
  "enquiry_type,system_type,quantity,message,details,source_path,referrer," +
  "user_agent,ip_hash,created_at,updated_at";

export const SUBSCRIBER_COLUMNS = "id,email,site,source_path,created_at";
