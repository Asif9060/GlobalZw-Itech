import { describeStore, getLeadStore, type StoreDescription } from "@/lib/leads";
import { defaultStats, emptyStatsFor } from "@/lib/leads/store";
import { getProductStore } from "@/lib/products";
import { SITE_SLUGS, type SiteSlug } from "@/lib/sites";
import type {
  Lead,
  LeadStatus,
  SiteSetting,
  SiteStats,
  Subscriber,
} from "@/lib/leads/types";

/**
 * Read-side queries for the admin portal.
 *
 * These are called from Server Components, so every page is rendered on the
 * server with fresh data. When no store is configured (a production deploy that
 * has not had its Supabase variables set) they return empty, flagged results
 * instead of throwing, so the portal can render setup instructions rather than
 * a stack trace.
 */

export type AdminSnapshot = {
  store: StoreDescription;
  /** False when there is no usable backend at all. */
  ready: boolean;
  siteStats: Record<SiteSlug, SiteStats>;
  overall: SiteStats;
  subscriberCount: number;
  productCount: number;
  settings: Record<SiteSlug, SiteSetting>;
};

export function defaultSettings(): Record<SiteSlug, SiteSetting> {
  return Object.fromEntries(
    SITE_SLUGS.map((site) => [
      site,
      { site, acceptingLeads: true, updatedAt: null } satisfies SiteSetting,
    ]),
  ) as Record<SiteSlug, SiteSetting>;
}

/** Sums the per-page counters. Counts add; `lastLeadAt` is a maximum, not a sum. */
function combine(stats: Record<SiteSlug, SiteStats>): SiteStats {
  const overall = defaultStats();
  for (const site of SITE_SLUGS) {
    const entry = stats[site];
    overall.total += entry.total;
    overall.new += entry.new;
    overall.inProgress += entry.inProgress;
    overall.resolved += entry.resolved;
    overall.today += entry.today;
    if (entry.lastLeadAt && (!overall.lastLeadAt || entry.lastLeadAt > overall.lastLeadAt)) {
      overall.lastLeadAt = entry.lastLeadAt;
    }
  }
  return overall;
}

export async function loadAdminSnapshot(): Promise<AdminSnapshot> {
  const store = describeStore();

  // The product catalogue has its own file store that works even when the lead
  // store is unconfigured, so it is read regardless of `ready` below.
  const productCount = await getProductStore()
    .listProducts()
    .then((products) => products.length)
    .catch(() => 0);

  if (store.kind === "unconfigured") {
    return {
      store,
      ready: false,
      siteStats: emptyStatsFor(SITE_SLUGS),
      overall: defaultStats(),
      subscriberCount: 0,
      productCount,
      settings: defaultSettings(),
    };
  }

  const leads = getLeadStore();

  const [siteStats, subscriberCount, settings] = await Promise.all([
    leads.allSiteStats(),
    leads.countSubscribers(),
    leads.getSiteSettings(),
  ]);

  return {
    store,
    ready: true,
    siteStats,
    overall: combine(siteStats),
    subscriberCount,
    productCount,
    settings,
  };
}

export type LeadFilters = {
  status?: LeadStatus;
  search?: string;
};

export async function loadSiteLeads(
  site: SiteSlug,
  filters: LeadFilters = {},
): Promise<Lead[]> {
  if (describeStore().kind === "unconfigured") return [];

  return getLeadStore().listLeads({
    site,
    status: filters.status,
    search: filters.search,
    limit: 300,
  });
}

export async function loadRecentLeads(limit = 8): Promise<Lead[]> {
  if (describeStore().kind === "unconfigured") return [];
  return getLeadStore().listLeads({ limit });
}

export async function loadSubscribers(limit = 500): Promise<Subscriber[]> {
  if (describeStore().kind === "unconfigured") return [];
  return getLeadStore().listSubscribers(limit);
}
