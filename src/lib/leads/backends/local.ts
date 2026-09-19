import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { SITE_SLUGS, type SiteSlug } from "@/lib/sites";
import { flattenFields, makeRef } from "@/lib/leads/ref";
import { LeadStoreError, type LeadStore, type SubscriberResult } from "@/lib/leads/store";
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
 * File-backed fallback store, used until Supabase credentials are supplied.
 *
 * It exists so the whole flow — landing page → API → admin portal — can be
 * built and verified on day one. It is deliberately simple: one JSON document,
 * read on demand and written atomically (temp file + rename) so a crash
 * mid-write cannot truncate it. Writes are serialised through a single promise
 * chain, which is sufficient because this only ever runs in local development.
 *
 * Not durable on most hosting platforms. `ALLOW_LOCAL_STORE=1` is required to
 * use it in production, and the admin UI shows a warning banner when it is.
 */

type StoreDocument = {
  version: 1;
  leads: Lead[];
  subscribers: Subscriber[];
  settings: Record<string, { acceptingLeads: boolean; updatedAt: string | null }>;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const EMPTY: StoreDocument = { version: 1, leads: [], subscribers: [], settings: {} };

/** Serialises read-modify-write cycles so two requests cannot clobber each other. */
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  // Keep the chain alive even when a task rejects.
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readDoc(): Promise<StoreDocument> {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreDocument>;
    return {
      version: 1,
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      subscribers: Array.isArray(parsed.subscribers) ? parsed.subscribers : [],
      settings: parsed.settings ?? {},
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return { ...EMPTY };
    if (error instanceof SyntaxError) {
      throw new LeadStoreError(
        `The local store at ${STORE_FILE} is not valid JSON. Delete it to start fresh.`,
        error,
      );
    }
    throw new LeadStoreError(`Could not read ${STORE_FILE}`, error);
  }
}

async function writeDoc(doc: StoreDocument): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${STORE_FILE}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(doc, null, 2), "utf8");
  await rename(temp, STORE_FILE);
}

function emptyStats(): SiteStats {
  return { total: 0, new: 0, inProgress: 0, resolved: 0, today: 0, lastLeadAt: null };
}

function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function matchesSearch(lead: Lead, needle: string): boolean {
  const haystack = [
    lead.name,
    lead.email,
    lead.company,
    lead.message,
    lead.ref,
    lead.phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export const localLeadStore: LeadStore = {
  kind: "local",

  async createLead(input: NewLead): Promise<Lead> {
    return withLock(async () => {
      const doc = await readDoc();
      const now = new Date().toISOString();
      const fields = flattenFields(input);

      // Retry in the vanishingly unlikely event of a reference collision.
      let ref = makeRef(input.site);
      for (let i = 0; i < 5 && doc.leads.some((lead) => lead.ref === ref); i += 1) {
        ref = makeRef(input.site);
      }

      const lead: Lead = {
        id: randomUUID(),
        ref,
        site: input.site,
        formId: input.formId,
        status: "new",
        ...fields,
        details: input.details,
        sourcePath: input.sourcePath,
        referrer: input.referrer,
        userAgent: input.userAgent,
        ipHash: input.ipHash,
        createdAt: now,
        updatedAt: now,
      };

      doc.leads.unshift(lead);
      await writeDoc(doc);
      return lead;
    });
  },

  async listLeads(query: LeadQuery): Promise<Lead[]> {
    const doc = await readDoc();
    let leads = doc.leads;

    if (query.site) leads = leads.filter((lead) => lead.site === query.site);
    if (query.status) leads = leads.filter((lead) => lead.status === query.status);

    if (query.search) {
      const needle = query.search.trim().toLowerCase();
      if (needle) leads = leads.filter((lead) => matchesSearch(lead, needle));
    }

    // Newest first, matching the Supabase backend's ordering.
    leads = [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const offset = Math.max(query.offset ?? 0, 0);
    const limit = Math.min(Math.max(query.limit ?? 200, 1), 500);
    return leads.slice(offset, offset + limit);
  },

  async updateLeadStatus(id: string, status: LeadStatus): Promise<Lead | null> {
    return withLock(async () => {
      const doc = await readDoc();
      const index = doc.leads.findIndex((lead) => lead.id === id);
      if (index === -1) return null;

      const updated: Lead = {
        ...doc.leads[index],
        status,
        updatedAt: new Date().toISOString(),
      };
      doc.leads[index] = updated;
      await writeDoc(doc);
      return updated;
    });
  },

  async deleteLead(id: string): Promise<boolean> {
    return withLock(async () => {
      const doc = await readDoc();
      const before = doc.leads.length;
      doc.leads = doc.leads.filter((lead) => lead.id !== id);
      if (doc.leads.length === before) return false;
      await writeDoc(doc);
      return true;
    });
  },

  async deleteLeadsBySite(site: SiteSlug): Promise<number> {
    return withLock(async () => {
      const doc = await readDoc();
      const before = doc.leads.length;
      doc.leads = doc.leads.filter((lead) => lead.site !== site);
      const removed = before - doc.leads.length;
      if (removed > 0) await writeDoc(doc);
      return removed;
    });
  },

  async stats(site?: SiteSlug): Promise<SiteStats> {
    const doc = await readDoc();
    const leads = site ? doc.leads.filter((lead) => lead.site === site) : doc.leads;

    const dayStart = startOfToday();
    const stats = emptyStats();
    stats.total = leads.length;

    for (const lead of leads) {
      if (lead.status === "new") stats.new += 1;
      else if (lead.status === "in_progress") stats.inProgress += 1;
      else if (lead.status === "resolved") stats.resolved += 1;

      if (new Date(lead.createdAt).getTime() >= dayStart) stats.today += 1;

      if (!stats.lastLeadAt || lead.createdAt > stats.lastLeadAt) {
        stats.lastLeadAt = lead.createdAt;
      }
    }

    return stats;
  },

  async allSiteStats(): Promise<Record<SiteSlug, SiteStats>> {
    const doc = await readDoc();
    const out = Object.fromEntries(
      SITE_SLUGS.map((site) => [site, emptyStats()]),
    ) as Record<SiteSlug, SiteStats>;

    const dayStart = startOfToday();
    for (const lead of doc.leads) {
      const stats = out[lead.site];
      if (!stats) continue;
      stats.total += 1;
      if (lead.status === "new") stats.new += 1;
      else if (lead.status === "in_progress") stats.inProgress += 1;
      else if (lead.status === "resolved") stats.resolved += 1;
      if (new Date(lead.createdAt).getTime() >= dayStart) stats.today += 1;
      if (!stats.lastLeadAt || lead.createdAt > stats.lastLeadAt) {
        stats.lastLeadAt = lead.createdAt;
      }
    }

    return out;
  },

  async addSubscriber({ email, site, sourcePath }): Promise<SubscriberResult> {
    return withLock(async () => {
      const doc = await readDoc();
      const normalized = email.toLowerCase();
      const existing = doc.subscribers.find(
        (item) => item.site === site && item.email.toLowerCase() === normalized,
      );
      if (existing) return { subscriber: existing, created: false };

      const subscriber: Subscriber = {
        id: randomUUID(),
        email,
        site,
        sourcePath,
        createdAt: new Date().toISOString(),
      };
      doc.subscribers.unshift(subscriber);
      await writeDoc(doc);
      return { subscriber, created: true };
    });
  },

  async listSubscribers(limit = 500): Promise<Subscriber[]> {
    const doc = await readDoc();
    return [...doc.subscribers]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, Math.min(Math.max(limit, 1), 1000));
  },

  async countSubscribers(): Promise<number> {
    const doc = await readDoc();
    return doc.subscribers.length;
  },

  async deleteSubscriber(id: string): Promise<boolean> {
    return withLock(async () => {
      const doc = await readDoc();
      const before = doc.subscribers.length;
      doc.subscribers = doc.subscribers.filter((item) => item.id !== id);
      if (doc.subscribers.length === before) return false;
      await writeDoc(doc);
      return true;
    });
  },

  async getSiteSettings(): Promise<Record<SiteSlug, SiteSetting>> {
    const doc = await readDoc();
    return Object.fromEntries(
      SITE_SLUGS.map((site) => {
        const stored = doc.settings[site];
        return [
          site,
          {
            site,
            acceptingLeads: stored ? stored.acceptingLeads !== false : true,
            updatedAt: stored?.updatedAt ?? null,
          } satisfies SiteSetting,
        ];
      }),
    ) as Record<SiteSlug, SiteSetting>;
  },

  async setSiteAccepting(site: SiteSlug, accepting: boolean): Promise<SiteSetting> {
    return withLock(async () => {
      const doc = await readDoc();
      const updatedAt = new Date().toISOString();
      doc.settings[site] = { acceptingLeads: accepting, updatedAt };
      await writeDoc(doc);
      return { site, acceptingLeads: accepting, updatedAt };
    });
  },
};
