/**
 * The five standalone landing pages in `public/`.
 *
 * This registry is the single source of truth for:
 *   - which `site` values the lead API accepts,
 *   - the admin portal's per-page sections (slug, label, accent, live URL),
 *   - the human reference prefix printed back to the customer,
 *   - which canonical fields each page's form is expected to send.
 *
 * The landing pages themselves send an already-canonical payload under
 * `fields` (see `src/lib/leads/validate.ts`), so adding a page means adding an
 * entry here plus a `fetch` call on that page — no server-side branching.
 */

export const SITE_SLUGS = [
  "landing",
  "traffic-solutions",
  "solar-solutions",
  "led-lighting",
  "engineering-consulting",
] as const;

export type SiteSlug = (typeof SITE_SLUGS)[number];

/** Canonical lead fields. Everything else a form sends lands in `details`. */
export const LEAD_FIELD_KEYS = [
  "name",
  "email",
  "phone",
  "company",
  "country",
  "city",
  "location",
  "enquiryType",
  "systemType",
  "quantity",
  "message",
] as const;

export type LeadFieldKey = (typeof LEAD_FIELD_KEYS)[number];

/** Column headings used by the admin detail view and the CSV export. */
export const LEAD_FIELD_LABELS: Record<LeadFieldKey, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  company: "Company",
  country: "Country",
  city: "City",
  location: "Site location",
  enquiryType: "Enquiry type",
  systemType: "System type",
  quantity: "Estimated quantity",
  message: "Message",
};

export type SiteDefinition = {
  slug: SiteSlug;
  /** Short label for the admin sidebar and breadcrumbs. */
  name: string;
  /** Brand the visitor sees on that page. */
  brand: string;
  /** One-line description of what the page sells. */
  summary: string;
  /** Public URL of the landing page. */
  path: string;
  /** `id` of the enquiry form on that page. */
  formId: string;
  /** `id` of the newsletter form, when the page has one. */
  newsletterFormId: string | null;
  /** Prefix for the customer-facing reference, e.g. `TF-482913`. */
  refPrefix: string;
  /** Accent colour so each section is visually distinct in the admin. */
  accent: string;
  /** Fields the API rejects the submission without. */
  required: LeadFieldKey[];
  /** Fields that page actually collects, in display order. */
  fields: LeadFieldKey[];
};

export const SITES: readonly SiteDefinition[] = [
  {
    slug: "landing",
    name: "Main Site",
    brand: "GLOBALZW-iTECH",
    summary: "Group homepage and proposal desk",
    path: "/",
    formId: "proposalForm",
    newsletterFormId: "newsForm",
    refPrefix: "PR",
    accent: "#ffb703",
    required: ["name", "email", "message"],
    fields: ["name", "email", "phone", "company", "enquiryType", "location", "message"],
  },
  {
    slug: "traffic-solutions",
    name: "Traffic Solutions",
    brand: "TRAFLOW",
    summary: "Intelligent traffic signals, poles and controllers",
    path: "/traffic-solutions",
    formId: "queryForm",
    newsletterFormId: "newsForm",
    refPrefix: "TF",
    accent: "#38bdf8",
    required: ["name", "email", "phone", "enquiryType"],
    fields: ["name", "email", "phone", "company", "enquiryType", "quantity", "message"],
  },
  {
    slug: "solar-solutions",
    name: "Solar Solutions",
    brand: "SOLARIS Energy",
    summary: "Solar PV, storage and EV charging",
    path: "/solar-solutions",
    formId: "queryForm",
    newsletterFormId: "newsForm",
    refPrefix: "SL",
    accent: "#3ddc84",
    required: ["name", "email", "phone", "country", "enquiryType", "message"],
    fields: [
      "name",
      "email",
      "phone",
      "country",
      "city",
      "enquiryType",
      "systemType",
      "message",
    ],
  },
  {
    slug: "led-lighting",
    name: "LED Lighting",
    brand: "LUMENAX",
    summary: "Smart LED road and street lighting",
    path: "/led-lighting",
    formId: "quoteForm",
    newsletterFormId: null,
    refPrefix: "LX",
    accent: "#a78bfa",
    required: ["name", "email", "message"],
    fields: ["name", "email", "message"],
  },
  {
    slug: "engineering-consulting",
    name: "Engineering Consulting",
    brand: "LUXGRID",
    summary: "Signal, light and solar consulting engineers",
    path: "/engineering-consulting",
    formId: "contactForm",
    newsletterFormId: null,
    refPrefix: "LG",
    accent: "#fb7185",
    required: ["name", "email", "message"],
    fields: ["name", "email", "enquiryType", "message"],
  },
] as const;

const BY_SLUG = new Map<string, SiteDefinition>(
  SITES.map((site) => [site.slug, site]),
);

export function getSite(slug: string): SiteDefinition | undefined {
  return BY_SLUG.get(slug);
}

/** Narrows an untrusted string to a known site slug. */
export function isSiteSlug(value: unknown): value is SiteSlug {
  return typeof value === "string" && BY_SLUG.has(value);
}

/** Throws for unknown slugs — only for call sites that already validated. */
export function requireSite(slug: string): SiteDefinition {
  const site = BY_SLUG.get(slug);
  if (!site) throw new Error(`Unknown site slug: ${slug}`);
  return site;
}
