import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminAuthWarnings, getAdminSession } from "@/lib/auth/admin";
import LoginForm from "./login-form";

/**
 * Admin sign-in.
 *
 * This sits outside the `(dashboard)` route group, so it is the one page under
 * /admin that is not behind the session guard. Anyone already signed in is sent
 * straight through.
 */

export const metadata: Metadata = { title: "Sign in" };

/** `ADMIN_EMAIL` is optional; when set, the sign-in form asks for it too. */
function emailIsRequired(): boolean {
  return Boolean(process.env.ADMIN_EMAIL?.trim());
}

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");

  return (
    <main className="ad-login">
      <div className="ad-login__card">
        <div className="ad-login__brand">
          <span className="ad-brand__mark" aria-hidden="true">
            GS
          </span>
          <div className="ad-brand__text">
            <div className="ad-brand__name">Global Suntech</div>
            <div className="ad-brand__sub">Control Panel</div>
          </div>
        </div>

        <h1 className="ad-login__title">Sign in</h1>
        <p className="ad-login__lede">
          Customer enquiries from all five landing pages land here. Enter the admin
          password to open the portal.
        </p>

        <LoginForm emailRequired={emailIsRequired()} />

        <div className="ad-form__note">
          The password comes from <code>ADMIN_PASSWORD</code> in your environment.
          Sessions are signed with <code>ADMIN_SESSION_SECRET</code> and last for{" "}
          <code>ADMIN_SESSION_HOURS</code> hours.
          {adminAuthWarnings().length > 0 && (
            <>
              <br />
              <br />
              <strong>Development defaults in use:</strong>{" "}
              {adminAuthWarnings().join(" ")}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
