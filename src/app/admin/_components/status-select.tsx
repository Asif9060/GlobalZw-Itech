"use client";

import { useTransition, type FormEvent } from "react";
import { LEAD_STATUS_LABEL, LEAD_STATUSES, type LeadStatus } from "@/lib/leads/types";
import { setLeadStatusAction } from "../actions";

/**
 * Status changer for one enquiry.
 *
 * Client-side only so the change can be dispatched the moment the operator
 * picks a value, instead of needing a separate "save" button. Submission goes
 * through the Server Action, which re-checks the session — the `disabled` state
 * here is feedback, not security.
 */
export default function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: LeadStatus;
}) {
  const [pending, startTransition] = useTransition();

  function onChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => {
      void setLeadStatusAction(data);
    });
  }

  return (
    <form className="ad-row" onSubmit={onChange}>
      <input type="hidden" name="id" value={id} />
      <label className="ad-form__label" htmlFor={`status-${id}`}>
        Status
      </label>
      <select
        id={`status-${id}`}
        className="ad-select"
        name="status"
        defaultValue={status}
        disabled={pending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        style={{ width: 158 }}
      >
        {LEAD_STATUSES.map((value) => (
          <option key={value} value={value}>
            {LEAD_STATUS_LABEL[value]}
          </option>
        ))}
      </select>
      {pending && <span className="ad-copy">saving…</span>}
    </form>
  );
}
