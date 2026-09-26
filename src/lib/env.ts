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

/** Environment switches read as off for any of these, in any case. Absent means on. */
function isSwitchOff(value: string | undefined): boolean {
  return ["off", "0", "false", "no", "disabled"].includes(clean(value).toLowerCase());
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

/* ── email notifications (Resend) ───────────────────────────────────────── */

/**
 * Resend's shared sandbox sender. It works with no domain setup, but it only
 * delivers to the address that owns the Resend account — which is enough to try
 * the notifications out and not enough to run them. Hence the warning below.
 */
const SANDBOX_FROM = "GlobalZwItech <onboarding@resend.dev>";

/** Resend accepts up to 50 recipients per message; this keeps a typo from queuing 50. */
const MAX_RECIPIENTS = 25;

/**
 * `LEAD_NOTIFICATION_TO` is a comma-separated list so a whole team can be
 * notified. `ADMIN_EMAIL` is accepted as a fallback because a single-operator
 * deployment has usually set it already for the login screen.
 */
function notificationRecipients(): string[] {
  const sources = [clean(process.env.LEAD_NOTIFICATION_TO), clean(process.env.ADMIN_EMAIL)];

  const seen = new Set<string>();
  for (const source of sources) {
    if (!source) continue;
    for (const candidate of source.split(/[,;\s]+/)) {
      const address = candidate.trim().toLowerCase();
      if (address) seen.add(address);
    }
    // First source that yields anything wins; ADMIN_EMAIL is only a fallback,
    // never an addition, so nobody is surprised by a copy they did not ask for.
    if (seen.size > 0) break;
  }

  return Array.from(seen).slice(0, MAX_RECIPIENTS);
}

export type EmailConfig = {
  /** Empty when Resend is not set up; every send is skipped in that case. */
  apiKey: string;
  /** RFC 5322 `"Name <address>"` sender. */
  from: string;
  /** Everyone a notification is delivered to. */
  recipients: string[];
  /** Forces Reply-To everywhere, instead of the customer's own address. */
  replyToOverride: string | null;
  /** True when the sender is Resend's shared address, which barely delivers. */
  sandboxSender: boolean;
  /** False only when `EMAIL_NOTIFICATIONS=off` — an operator kill switch. */
  enabled: boolean;
  /**
   * Newsletter signups get their own switch. A busy page can add several
   * subscribers a day, and an operator who only wants to hear about enquiries
   * should not have to silence both to get that.
   */
  subscriberNotifications: boolean;
  warnings: string[];
};

export function emailConfig(): EmailConfig {
  const warnings: string[] = [];

  const apiKey = clean(process.env.RESEND_API_KEY);
  if (!apiKey) {
    warnings.push(
      "RESEND_API_KEY is unset, so no notification emails are being sent. " +
        "Enquiries are still stored and shown in the portal.",
    );
  }

  const configuredFrom = clean(process.env.LEAD_NOTIFICATION_FROM);
  const from = configuredFrom || SANDBOX_FROM;
  // The sandbox address is worth flagging whether it was defaulted to or set on
  // purpose — it cannot deliver to anyone but the Resend account's own address,
  // which is easy to miss when the mail quietly only reaches you.
  const sandboxSender = from.includes("resend.dev");

  if (!configuredFrom) {
    warnings.push(
      "LEAD_NOTIFICATION_FROM is unset, so Resend's sandbox sender is being used. " +
        "It only delivers to the address that owns the Resend account — verify a " +
        "domain and set the sender before going live.",
    );
  } else if (sandboxSender) {
    warnings.push(
      "LEAD_NOTIFICATION_FROM points at Resend's sandbox sender, which only delivers " +
        "to the address that owns the Resend account. Verify a domain and send from it.",
    );
  }

  const recipients = notificationRecipients();
  if (recipients.length === 0) {
    warnings.push(
      "No notification recipient is set. Set LEAD_NOTIFICATION_TO (comma-separated) " +
        "or ADMIN_EMAIL, otherwise nobody is told an enquiry arrived.",
    );
  }

  const enabled = !isSwitchOff(process.env.EMAIL_NOTIFICATIONS);

  return {
    apiKey,
    from,
    recipients,
    replyToOverride: clean(process.env.LEAD_NOTIFICATION_REPLY_TO) || null,
    sandboxSender,
    enabled,
    subscriberNotifications: enabled && !isSwitchOff(process.env.SUBSCRIBER_NOTIFICATIONS),
    warnings,
  };
}

/** True when a notification would actually leave the server. */
export function isEmailConfigured(): boolean {
  const config = emailConfig();
  return config.enabled && Boolean(config.apiKey) && config.recipients.length > 0;
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
