"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "../actions";

/**
 * The sign-in form.
 *
 * A Client Component only so it can show a pending state and the error returned
 * by the action. The credential check itself happens in the action, on the
 * server — nothing about the password is visible from here.
 */

const INITIAL: LoginState = { error: null };

export default function LoginForm({ emailRequired }: { emailRequired: boolean }) {
  const [state, action, pending] = useActionState(signIn, INITIAL);

  return (
    <form className="ad-form" action={action}>
      <div className="ad-form__row">
        <label className="ad-form__label" htmlFor="admin-email">
          Email address {emailRequired ? "" : "(optional)"}
        </label>
        <input
          id="admin-email"
          className="ad-input"
          type="email"
          name="email"
          autoComplete="username"
          placeholder={emailRequired ? "you@globalsuntech.com" : "Not required for this setup"}
          aria-describedby={state.error ? "admin-error" : undefined}
        />
      </div>

      <div className="ad-form__row">
        <label className="ad-form__label" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          className="ad-input"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          autoFocus
          aria-describedby={state.error ? "admin-error" : undefined}
        />
      </div>

      {state.error && (
        <p className="ad-form__error" id="admin-error" role="alert">
          {state.error}
        </p>
      )}

      <button className="ad-btn ad-btn--primary ad-btn--block" type="submit" disabled={pending}>
        {pending ? "Checking…" : "Enter portal"}
      </button>
    </form>
  );
}
