import { SITE_SLUGS, type SiteSlug } from "@/lib/sites";
import { tableNames } from "@/lib/env";
import { describeSupabaseError, getSupabaseAdmin, PG_ERROR } from "@/lib/supabase/server";
import {
  LEAD_COLUMNS,
  SUBSCRIBER_COLUMNS,
  toLead,
  toSubscriber,
  type LeadRow,
  type SiteSettingRow,
  type SubscriberRow,
} from "@/lib/leads/map";
import { flattenFields, withRefRetry } from "@/lib/leads/ref";
import {
  LeadStoreError,
  type LeadStore,
  type SubscriberResult,
} from "@/lib/leads/store";
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
 * Supabase-backed store. Every call runs on the server with the service-role
 * key, so RLS on the tables is bypassed here and nowhere else.
 */

type AnyResult = { data: unknown; error: { code?: string; message?: string; hint?: string | null } | null };

function client() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new LeadStoreError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return supabase;
}

/** Unwraps a PostgREST response, converting failures into a store error. */
function unwrap<T>(result: AnyResult, what: string): T {
  if (result.error) {
    throw new LeadStoreError(
      `${what} failed: ${describeSupabaseError(result.error)}`,
      result.error,
    );
  }
  return result.data as T;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === PG_ERROR.uniqueViolation
  );
}

/**
 * PostgREST's `or` filter is comma/parenthesis delimited, so a search term
 * containing those characters would be parsed as syntax. They are stripped
 * rather than escaped — this is a search box, not a query language.
 */
function sanitizeSearch(term: string): string {
  return term.replace(/[,()*%\\]/g, "").slice(0, 80).trim();
}

function toSiteStats(row: {
  total?: number | string | null;
  new?: number | string | null;
  in_progress?: number | string | null;
  resolved?: number | string | null;
  today?: number | string | null;
  last_lead?: string | null;
} | null): SiteStats {
  const num = (value: number | string | null | undefined) => Number(value ?? 0) || 0;
  return {
    total: num(row?.total),
    new: num(row?.new),
    inProgress: num(row?.in_progress),
    resolved: num(row?.resolved),
    today: num(row?.today),
    lastLeadAt: row?.last_lead ?? null,
  };
}

export const supabaseLeadStore: LeadStore = {
  kind: "supabase",

  async createLead(input: NewLead): Promise<Lead> {
    return withRefRetry(
      input.site,
      async (ref) => {
        const row = {
          ref,
          site: input.site,
          form_id: input.formId,
          ...mapFieldsToRow(input),
          details: input.details,
          source_path: input.sourcePath,
          referrer: input.referrer,
          user_agent: input.userAgent,
          ip_hash: input.ipHash,
        };

        const result = await client()
          .from(tableNames.leads)
          .insert(row)
          .select(LEAD_COLUMNS)
          .single();

        return toLead(unwrap<LeadRow>(result, "Inserting the lead"));
      },
      isUniqueViolation,
    );
  },

  async listLeads(query: LeadQuery): Promise<Lead[]> {
    let builder = client().from(tableNames.leads).select(LEAD_COLUMNS);

    if (query.site) builder = builder.eq("site", query.site);
    if (query.status) builder = builder.eq("status", query.status);

    if (query.search) {
      const term = sanitizeSearch(query.search);
      if (term) {
        const pattern = `*${term}*`;
        builder = builder.or(
          [
            `name.ilike.${pattern}`,
            `email.ilike.${pattern}`,
            `company.ilike.${pattern}`,
            `message.ilike.${pattern}`,
            `ref.ilike.${pattern}`,
          ].join(","),
        );
      }
    }

    const limit = Math.min(Math.max(query.limit ?? 200, 1), 500);
    const offset = Math.max(query.offset ?? 0, 0);

    const result = await builder
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return unwrap<LeadRow[]>(result, "Listing leads").map(toLead);
  },

  async updateLeadStatus(id: string, status: LeadStatus): Promise<Lead | null> {
    const result = await client()
      .from(tableNames.leads)
      .update({ status })
      .eq("id", id)
      .select(LEAD_COLUMNS)
      .maybeSingle();

    const row = unwrap<LeadRow | null>(result, "Updating the lead status");
    return row ? toLead(row) : null;
  },

  async deleteLead(id: string): Promise<boolean> {
    const result = await client()
      .from(tableNames.leads)
      .delete()
      .eq("id", id)
      .select("id");

    return unwrap<{ id: string }[]>(result, "Deleting the lead").length > 0;
  },

  async deleteLeadsBySite(site: SiteSlug): Promise<number> {
    const result = await client()
      .from(tableNames.leads)
      .delete()
      .eq("site", site)
      .select("id");

    return unwrap<{ id: string }[]>(result, `Deleting ${site} leads`).length;
  },

  async stats(site?: SiteSlug): Promise<SiteStats> {
    const result = await client().rpc("lead_stats", { p_site: site ?? null });
    const data = unwrap<Parameters<typeof toSiteStats>[0][]>(result, "Reading lead stats");
    return toSiteStats(data?.[0] ?? null);
  },

  async allSiteStats(): Promise<Record<SiteSlug, SiteStats>> {
    const entries = await Promise.all(
      SITE_SLUGS.map(async (site) => [site, await this.stats(site)] as const),
    );
    return Object.fromEntries(entries) as Record<SiteSlug, SiteStats>;
  },

  async addSubscriber({ email, site, sourcePath }): Promise<SubscriberResult> {
    const result = await client()
      .from(tableNames.subscribers)
      .insert({ email, site, source_path: sourcePath })
      .select(SUBSCRIBER_COLUMNS)
      .single();

    if (result.error) {
      // Already on the list is a success from the visitor's point of view.
      if (result.error.code === PG_ERROR.uniqueViolation) {
        const existing = await client()
          .from(tableNames.subscribers)
          .select(SUBSCRIBER_COLUMNS)
          .eq("site", site)
          .eq("email", email)
          .maybeSingle();

        const row = unwrap<SubscriberRow | null>(existing, "Finding the subscriber");
        if (row) return { subscriber: toSubscriber(row), created: false };
      }
      throw new LeadStoreError(
        `Subscribing failed: ${describeSupabaseError(result.error)}`,
        result.error,
      );
    }

    return { subscriber: toSubscriber(result.data as SubscriberRow), created: true };
  },

  async listSubscribers(limit = 500): Promise<Subscriber[]> {
    const result = await client()
      .from(tableNames.subscribers)
      .select(SUBSCRIBER_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 1000));

    return unwrap<SubscriberRow[]>(result, "Listing subscribers").map(toSubscriber);
  },

  async countSubscribers(): Promise<number> {
    const result = await client()
      .from(tableNames.subscribers)
      .select("id", { count: "exact", head: true });

    if (result.error) {
      throw new LeadStoreError(
        `Counting subscribers failed: ${describeSupabaseError(result.error)}`,
        result.error,
      );
    }
    return result.count ?? 0;
  },

  async deleteSubscriber(id: string): Promise<boolean> {
    const result = await client()
      .from(tableNames.subscribers)
      .delete()
      .eq("id", id)
      .select("id");

    return unwrap<{ id: string }[]>(result, "Deleting the subscriber").length > 0;
  },

  async getSiteSettings(): Promise<Record<SiteSlug, SiteSetting>> {
    const result = await client()
      .from(tableNames.settings)
      .select("site,accepting_leads,updated_at");

    const rows = unwrap<SiteSettingRow[]>(result, "Reading site settings");

    // Start from "everything open" so a page works even before its row exists.
    const settings = Object.fromEntries(
      SITE_SLUGS.map((site) => [
        site,
        { site, acceptingLeads: true, updatedAt: null } satisfies SiteSetting,
      ]),
    ) as Record<SiteSlug, SiteSetting>;

    for (const row of rows ?? []) {
      if (!(SITE_SLUGS as readonly string[]).includes(row.site)) continue;
      const site = row.site as SiteSlug;
      settings[site] = {
        site,
        acceptingLeads: row.accepting_leads !== false,
        updatedAt: row.updated_at,
      };
    }

    return settings;
  },

  async setSiteAccepting(site: SiteSlug, accepting: boolean): Promise<SiteSetting> {
    const result = await client()
      .from(tableNames.settings)
      .upsert(
        { site, accepting_leads: accepting, updated_at: new Date().toISOString() },
        { onConflict: "site" },
      )
      .select("site,accepting_leads,updated_at")
      .single();

    const row = unwrap<SiteSettingRow>(result, "Updating the site setting");
    return { site, acceptingLeads: row.accepting_leads !== false, updatedAt: row.updated_at };
  },
};

function mapFieldsToRow(input: NewLead) {
  const fields = flattenFields(input);
  return {
    name: fields.name,
    email: fields.email,
    phone: fields.phone,
    company: fields.company,
    country: fields.country,
    city: fields.city,
    location: fields.location,
    enquiry_type: fields.enquiryType,
    system_type: fields.systemType,
    quantity: fields.quantity,
    message: fields.message,
  };
}
