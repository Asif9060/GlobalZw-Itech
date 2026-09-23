"use client";

import { useActionState } from "react";
import { sendTestEmailAction, type TestEmailState } from "../actions";

/**
 * "Send a test email" in site controls.
 *
 * A Client Component only so it can show the pending state and the outcome
 * reported by the action. The send itself happens on the server, and the result
 * is the whole point of the control: an operator who is unsure whether
 * notifications work needs an answer, not a spinner that disappears.
 */

const INITIAL: TestEmailState = { status: "idle", message: "" };

export default function TestEmailForm({
  defaultRecipient,
}: {
  /** Where it will go if the field is left empty. */
  defaultRecipient: string;
}) {
  const [state, action, pending] = useActionState(sendTestEmailAction, INITIAL);

  return (
    <form className="ad-form" action={action}>
      <div className="ad-form__row">
        <label className="ad-form__label" htmlFor="test-email-to">
          Send a test email
        </label>
        <div className="ad-row">
          <input
            id="test-email-to"
            className="ad-input ad-input--inline"
            type="email"
            name="to"
            autoComplete="off"
            placeholder={defaultRecipient}
            disabled={pending}
          />
          <button className="ad-btn ad-btn--primary" type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send test"}
          </button>
        </div>
        <p className="ad-panel__hint">
          Leave empty to send to every notified address, or name one to prove delivery to a
          single inbox. Nothing is sent to a customer.
        </p>
      </div>

      {state.message && (
        <p
          className={state.status === "error" ? "ad-form__error" : "ad-form__ok"}
          role="status"
          aria-live="polite"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
