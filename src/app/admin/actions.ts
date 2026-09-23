"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { assertAdmin, endAdminSession, startAdminSession, verifyAdminCredentials } from "@/lib/auth/admin";
import { sendTestEmail } from "@/lib/email";
import { getLeadStore } from "@/lib/leads";
import { isLeadStatus } from "@/lib/leads/types";
import { isValidEmail } from "@/lib/leads/validate";
import { isSiteSlug } from "@/lib/sites";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Every mutation the admin portal can perform.
 *
 * These are Server Actions, so they are reachable by a direct POST and not only
 * through the UI — which is why each one calls `assertAdmin()` before touching
 * anything. Hiding a button is presentation; this is authorization.
 *
 * After a write, `revalidatePath("/admin", "layout")` drops the cached RSC
 * payload for the whole portal so the next render reflects the change. The
 * pages are request-rendered anyway (they read the session cookie), so this is
 * about the client-side router cache rather than the data itself.
 */

export type LoginState = { error: string | null };

const ADMIN_PATH = "/admin";

function refreshAdmin() {
  revalidatePath(ADMIN_PATH, "layout");
}

/* ── authentication ─────────────────────────────────────────────────────── */

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const incoming = await headers();
  const address =
    incoming.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    incoming.get("x-real-ip") ??
    "local";

  const limit = rateLimit(`admin-login:${address}`, 8, 5 * 60 * 1000);
  if (!limit.ok) {
    return {
      error: `Too many sign-in attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} minute(s).`,
    };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!password) {
    return { error: "Enter the admin password." };
  }

  if (!verifyAdminCredentials(email, password)) {
    return { error: "Incorrect credentials. Check the password and try again." };
  }

  await startAdminSession();
  refreshAdmin();
  redirect(ADMIN_PATH);
}

export async function signOut(): Promise<void> {
  await endAdminSession();
  refreshAdmin();
  redirect("/admin/login");
}

/* ── lead workflow ──────────────────────────────────────────────────────── */

export async function setLeadStatusAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isLeadStatus(status)) return;

  await getLeadStore().updateLeadStatus(id, status);
  refreshAdmin();
}

export async function deleteLeadAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getLeadStore().deleteLead(id);
  refreshAdmin();
}

/** Wipes one landing page's inbox. Guarded in the UI by a typed confirmation. */
export async function clearSiteLeadsAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const site = String(formData.get("site") ?? "");
  if (!isSiteSlug(site)) return;

  await getLeadStore().deleteLeadsBySite(site);
  refreshAdmin();
}

/* ── per-page switches ──────────────────────────────────────────────────── */

export async function setSiteAcceptingAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const site = String(formData.get("site") ?? "");
  if (!isSiteSlug(site)) return;

  // An unchecked checkbox sends nothing at all, so "absent" is the off state.
  const accepting = formData.get("accepting") === "on";

  await getLeadStore().setSiteAccepting(site, accepting);
  refreshAdmin();
  // The public pages read this through /api/leads, whose response is uncached,
  // so no path outside the admin needs invalidating.
}

/* ── subscribers ────────────────────────────────────────────────────────── */

export async function deleteSubscriberAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getLeadStore().deleteSubscriber(id);
  refreshAdmin();
}

/* ── notifications ──────────────────────────────────────────────────────── */

export type TestEmailState = {
  status: "idle" | "sent" | "error";
  message: string;
};

/**
 * Sends the notification test message.
 *
 * Unlike the enquiry path this one *does* await the send, because the operator
 * asked for it directly and the answer — Resend accepted it, Resend refused it,
 * or nothing is configured — is the entire point of pressing the button.
 *
 * The optional address lets an operator prove delivery to a colleague's inbox
 * without first adding them to the notification list.
 */
export async function sendTestEmailAction(
  _previous: TestEmailState,
  formData: FormData,
): Promise<TestEmailState> {
  await assertAdmin();

  // Not a security boundary — the caller is already signed in — but a stuck
  // button should not be able to flood an inbox.
  const limit = rateLimit("admin-test-email", 5, 60 * 1000);
  if (!limit.ok) {
    return {
      status: "error",
      message: `That is a lot of test messages. Try again in ${limit.retryAfter} second(s).`,
    };
  }

  const override = String(formData.get("to") ?? "").trim();
  if (override && !isValidEmail(override)) {
    return { status: "error", message: "That does not look like an email address." };
  }

  const outcome = await sendTestEmail(override || null);

  if (outcome.ok) {
    return {
      status: "sent",
      message:
        `Resend accepted the message for ${outcome.recipients.join(", ")}. ` +
        `Give it a minute, and check the spam folder too. Message id ${outcome.id}.`,
    };
  }

  // A skipped send already explains itself in full sentences, so it is shown
  // as-is; only a rejection needs the context of who rejected it.
  return {
    status: "error",
    message: outcome.skipped
      ? outcome.reason
      : `Resend refused the message: ${outcome.reason}`,
  };
}
