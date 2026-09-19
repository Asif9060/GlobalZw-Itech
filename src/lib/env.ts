/**
 * Central environment access.
 *
 * Everything the server needs is read through here so that a missing value
 * produces one clear message instead of a scattered `undefined` somewhere deep
 * in a request. Nothing in this file may be imported into a Client Component —
 * `serverEnv()` reads secrets.
 */

const DEV_FALLBACK_ADMIN_PASSWORD = "solar123";
const DEV_FALLBACK_SESSION_SECRET = "globalzwitech-dev-session-secret";

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

export const publicEnv = {
  get supabaseUrl() {
    return clean(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "");
  },
  get supabaseAnonKey() {
    return clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
  get siteUrl() {
    return clean(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000";
  },
};

const isProduction = process.env.NODE_ENV === "production";

/** True when the service-role credentials needed for server-side data access exist. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    publicEnv.supabaseUrl &&
      clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

/**
 * The admin portal and the lead API fall back to a JSON file store when
 * Supabase is not configured, so the site is fully usable before credentials
 * arrive. That fallback is refused in production unless explicitly allowed,
 * because a container filesystem is not durable storage.
 */
export function isLocalStoreAllowed(): boolean {
  if (process.env.ALLOW_LOCAL_STORE === "1") return true;
  return !isProduction;
}

export type AdminAuthConfig = {
  password: string;
  email: string | null;
  sessionSecret: string;
  sessionHours: number;
  /** Set when a development fallback is in use, so the UI can say so out loud. */
  warnings: string[];
};

export function adminAuthConfig(): AdminAuthConfig {
  const warnings: string[] = [];

  let password = clean(process.env.ADMIN_PASSWORD);
  if (!password) {
    if (isProduction) {
      throw new Error(
        "ADMIN_PASSWORD is required in production — set it in your environment.",
      );
    }
    password = DEV_FALLBACK_ADMIN_PASSWORD;
    warnings.push(`ADMIN_PASSWORD is unset; using the development default "${DEV_FALLBACK_ADMIN_PASSWORD}".`);
  }

  let sessionSecret = clean(process.env.ADMIN_SESSION_SECRET);
  if (!sessionSecret) {
    if (isProduction) {
      throw new Error(
        "ADMIN_SESSION_SECRET is required in production — generate one with " +
          `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
      );
    }
    sessionSecret = DEV_FALLBACK_SESSION_SECRET;
    warnings.push("ADMIN_SESSION_SECRET is unset; sessions are signed with a public development value.");
  }

  const hours = Number.parseInt(clean(process.env.ADMIN_SESSION_HOURS), 10);
  const sessionHours = Number.isFinite(hours) && hours > 0 ? hours : 12;

  return {
    password,
    email: clean(process.env.ADMIN_EMAIL) || null,
    sessionSecret,
    sessionHours,
    warnings,
  };
}

export const tableNames = {
  get leads() {
    return clean(process.env.SUPABASE_LEADS_TABLE) || "leads";
  },
  get subscribers() {
    return clean(process.env.SUPABASE_SUBSCRIBERS_TABLE) || "newsletter_subscribers";
  },
  get settings() {
    return clean(process.env.SUPABASE_SETTINGS_TABLE) || "site_settings";
  },
};

export const ADMIN_SESSION_COOKIE = "gs_admin_session";
