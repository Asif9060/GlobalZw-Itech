import type { SiteSlug } from "@/lib/sites";
import type {
  Lead,
  LeadQuery,
  LeadStatus,
  NewLead,
  SiteSetting,
  SiteStats,
  Subscriber,
} from "@/lib/leads/types";

/**
 * The Data Access Layer for customer enquiries.
 *
 * Everything that reads or writes a lead goes through this interface, which is
 * what makes the two backends interchangeable:
 *
 *   - `supabase` — the real store, used as soon as credentials are present.
 *   - `local`    — a JSON file under `.data/`, so the site is fully working
 *                  before credentials arrive. Refused in production unless
 *                  ALLOW_LOCAL_STORE=1, because container filesystems are not
 *                  durable.
 *
 * Callers never learn which backend answered, apart from `kind`, which the
 * admin UI surfaces as a banner when the fallback is in use.
 */

export type LeadStoreKind = "supabase" | "local";

export type SubscriberResult = { subscriber: Subscriber; created: boolean };

export interface LeadStore {
  readonly kind: LeadStoreKind;

  createLead(input: NewLead): Promise<Lead>;
  listLeads(query: LeadQuery): Promise<Lead[]>;
  updateLeadStatus(id: string, status: LeadStatus): Promise<Lead | null>;
  deleteLead(id: string): Promise<boolean>;
  /** Removes every lead for one landing page; returns how many were deleted. */
  deleteLeadsBySite(site: SiteSlug): Promise<number>;

  stats(site?: SiteSlug): Promise<SiteStats>;
  allSiteStats(): Promise<Record<SiteSlug, SiteStats>>;

  addSubscriber(input: {
    email: string;
    site: SiteSlug;
    sourcePath: string | null;
  }): Promise<SubscriberResult>;
  listSubscribers(limit?: number): Promise<Subscriber[]>;
  countSubscribers(): Promise<number>;
  deleteSubscriber(id: string): Promise<boolean>;

  getSiteSettings(): Promise<Record<SiteSlug, SiteSetting>>;
  setSiteAccepting(site: SiteSlug, accepting: boolean): Promise<SiteSetting>;
}

/** Raised when the store itself fails, as opposed to bad user input. */
export class LeadStoreError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "LeadStoreError";
    this.cause = cause;
  }
}

/** A missing settings row means "open"; only an explicit false closes a page. */
export function defaultStats(): SiteStats {
  return { total: 0, new: 0, inProgress: 0, resolved: 0, today: 0, lastLeadAt: null };
}

export function emptyStatsFor(sites: readonly SiteSlug[]): Record<SiteSlug, SiteStats> {
  return Object.fromEntries(sites.map((site) => [site, defaultStats()])) as Record<
    SiteSlug,
    SiteStats
  >;
}
