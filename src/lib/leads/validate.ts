import {
  LEAD_FIELD_KEYS,
  requireSite,
  type LeadFieldKey,
  type SiteSlug,
} from "@/lib/sites";

/**
 * Server-side validation for public form submissions.
 *
 * The landing pages run their own client-side checks for immediate feedback,
 * but nothing they send is trusted: this module is the only thing that decides
 * whether a payload becomes a row. It both rejects bad input and normalises
 * good input, so the database never sees control characters, runaway lengths,
 * or keys outside the canonical set.
 */

type NormalizedFields = Partial<Record<LeadFieldKey, string>>;

export type LeadSubmission = {
  site: SiteSlug;
  formId: string | null;
  fields: NormalizedFields;
  /** Extra answers that are not canonical columns, kept so nothing is lost. */
  details: Record<string, string>;
  sourcePath: string | null;
};

export type ValidationFailure = {
  ok: false;
  message: string;
  errors: Record<string, string>;
};

export type ValidationSuccess = { ok: true; value: LeadSubmission };

export type ValidationResult = ValidationSuccess | ValidationFailure;

/* ── limits ─────────────────────────────────────────────────────────────── */

const FIELD_LIMITS: Record<LeadFieldKey, number> = {
  name: 120,
  email: 254,
  phone: 40,
  company: 160,
  country: 80,
  city: 80,
  location: 160,
  enquiryType: 120,
  systemType: 120,
  quantity: 40,
  message: 5000,
};

const MAX_DETAIL_KEYS = 25;
const MAX_DETAIL_KEY_LENGTH = 60;
const MAX_DETAIL_VALUE_LENGTH = 500;
const MAX_PATH_LENGTH = 300;

/**
 * Same shape the landing pages check for, so a value that passes in the browser
 * cannot then be rejected by the server. Deliberately permissive — the goal is
 * to catch typos, not to out-guess RFC 5322.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Control characters that would corrupt a CSV export or a terminal log. */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/* ── normalisation ──────────────────────────────────────────────────────── */

/**
 * Collapses whitespace and strips control characters. Short single-line fields
 * also lose their newlines; `message` keeps them so a multi-line project brief
 * survives intact.
 */
function normalizeText(value: string, multiline: boolean, maxLength: number): string {
  let out = value.replace(CONTROL_CHARS, "").replace(/\r\n?/g, "\n");
  out = multiline
    ? out.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim()
    : out.replace(/\s+/g, " ").trim();
  return out.slice(0, maxLength);
}

function asString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLeadFieldKey(key: string): key is LeadFieldKey {
  return (LEAD_FIELD_KEYS as readonly string[]).includes(key);
}

export function isValidEmail(value: string): boolean {
  return value.length <= FIELD_LIMITS.email && EMAIL_RE.test(value);
}

/* ── payload reading ────────────────────────────────────────────────────── */

/**
 * Reads a submission from a request.
 *
 * JSON is what the landing pages send. `application/x-www-form-urlencoded` and
 * `multipart/form-data` are also accepted, keyed by canonical field names, so
 * the endpoint works from `curl` and from a plain HTML form post.
 */
export async function readLeadPayload(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await request.json();
    } catch {
      return null;
    }
  }

  if (
    contentType.includes("form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    try {
      const form = await request.formData();
      const payload: Record<string, unknown> = {};
      const fields: Record<string, string> = {};
      const details: Record<string, string> = {};

      for (const [key, raw] of form.entries()) {
        if (typeof raw !== "string") continue; // file uploads are ignored
        if (key === "site" || key === "formId" || key === "path" || key === "referrer") {
          payload[key] = raw;
        } else if (isLeadFieldKey(key)) {
          fields[key] = raw;
        } else {
          details[key] = raw;
        }
      }

      payload.fields = fields;
      payload.details = details;
      return payload;
    } catch {
      return null;
    }
  }

  return null;
}

/** `"name"` → `"Name"`, used to label validation errors in the response. */
export function fieldLabel(key: LeadFieldKey): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/* ── the validator ──────────────────────────────────────────────────────── */

export function validateLeadSubmission(raw: unknown): ValidationResult {
  if (!isPlainObject(raw)) {
    return { ok: false, message: "Expected a JSON object body.", errors: {} };
  }

  const rawSite = asString(raw.site);
  if (!rawSite) {
    return { ok: false, message: "Missing `site` — which landing page sent this?", errors: {} };
  }

  let site: SiteSlug;
  try {
    site = requireSite(rawSite).slug;
  } catch {
    return { ok: false, message: `Unknown site "${rawSite}".`, errors: {} };
  }

  if (!isPlainObject(raw.fields)) {
    return { ok: false, message: "Missing `fields` object.", errors: {} };
  }

  const errors: Record<string, string> = {};
  const fields: NormalizedFields = {};
  /** Answers with no column of their own, promoted to `details` below. */
  const extras: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(raw.fields)) {
    const value = asString(rawValue);
    if (value === null) continue;

    if (!isLeadFieldKey(key)) {
      // The landing pages route extras into `details` themselves, but anything
      // that posts here directly (a plain form, an integration) may not. Keeping
      // them means an unrecognised answer is never silently discarded.
      const cleanKey = normalizeText(key, false, MAX_DETAIL_KEY_LENGTH);
      const cleanValue = normalizeText(value, true, MAX_DETAIL_VALUE_LENGTH);
      if (cleanKey && cleanValue) extras[cleanKey] = cleanValue;
      continue;
    }

    const normalized = normalizeText(value, key === "message", FIELD_LIMITS[key]);
    if (normalized === "") continue;
    fields[key] = normalized;
  }

  // Required fields come from the site registry, so a page that stops sending
  // a field cannot silently start accepting incomplete enquiries.
  for (const key of requireSite(site).required) {
    if (!fields[key]) {
      errors[key] = `${fieldLabel(key)} is required.`;
    }
  }

  if (fields.email && !isValidEmail(fields.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (Object.keys(errors).length > 0) {
    const [firstKey] = Object.keys(errors);
    return {
      ok: false,
      message: errors[firstKey] ?? "Some fields need attention.",
      errors,
    };
  }

  // Anything the page sent that we have no column for is preserved as detail.
  // Extras found in `fields` come first so an explicit `details` entry wins.
  const details: Record<string, string> = { ...extras };

  if (isPlainObject(raw.details)) {
    for (const [key, rawValue] of Object.entries(raw.details)) {
      if (Object.keys(details).length >= MAX_DETAIL_KEYS) break;
      const value = asString(rawValue);
      if (value === null) continue;
      const cleanKey = normalizeText(key, false, MAX_DETAIL_KEY_LENGTH);
      const cleanValue = normalizeText(value, true, MAX_DETAIL_VALUE_LENGTH);
      if (cleanKey && cleanValue) details[cleanKey] = cleanValue;
    }
  }

  const rawPath = asString(raw.path);
  const sourcePath = rawPath ? normalizeText(rawPath, false, MAX_PATH_LENGTH) : null;

  return {
    ok: true,
    value: {
      site,
      formId: asString(raw.formId)?.slice(0, 60) ?? null,
      fields,
      details,
      sourcePath,
    },
  };
}
