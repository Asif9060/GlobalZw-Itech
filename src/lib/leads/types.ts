import type { LeadFieldKey, SiteSlug } from "@/lib/sites";

/** Lifecycle of a customer enquiry, mirroring the `lead_status` Postgres enum. */
export const LEAD_STATUSES = ["new", "in_progress", "resolved"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
};

export function isLeadStatus(value: unknown): value is LeadStatus {
  return (
    typeof value === "string" &&
    (LEAD_STATUSES as readonly string[]).includes(value)
  );
}

/** A stored enquiry, in camelCase, already mapped out of the database. */
export type Lead = {
  id: string;
  ref: string;
  site: SiteSlug;
  formId: string | null;
  status: LeadStatus;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  city: string | null;
  location: string | null;
  enquiryType: string | null;
  systemType: string | null;
  quantity: string | null;
  message: string | null;
  /** Page-specific extra answers, kept verbatim. */
  details: Record<string, string>;
  sourcePath: string | null;
  referrer: string | null;
  userAgent: string | null;
  /** SHA-256 of the client IP — we never store the address itself. */
  ipHash: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Validated input handed to a store backend by the lead API. */
export type NewLead = {
  site: SiteSlug;
  formId: string | null;
  fields: Partial<Record<LeadFieldKey, string>>;
  details: Record<string, string>;
  sourcePath: string | null;
  referrer: string | null;
  userAgent: string | null;
  ipHash: string | null;
};

export type Subscriber = {
  id: string;
  email: string;
  site: SiteSlug;
  sourcePath: string | null;
  createdAt: string;
};

export type SiteSetting = {
  site: SiteSlug;
  /** When false, the public API refuses new enquiries for that page. */
  acceptingLeads: boolean;
  updatedAt: string | null;
};

export type LeadQuery = {
  site?: SiteSlug;
  status?: LeadStatus;
  /** Case-insensitive match against name, email, company, message and ref. */
  search?: string;
  limit?: number;
  offset?: number;
};

export type LeadStats = {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  /** Enquiries received since midnight, server local time. */
  today: number;
};

export type SiteStats = LeadStats & { lastLeadAt: string | null };
