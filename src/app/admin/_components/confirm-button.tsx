"use client";

import type { ReactNode } from "react";

/**
 * A submit button that asks for confirmation first.
 *
 * It lives inside a `<form action={serverAction}>`, so it degrades sensibly:
 * without JavaScript the confirmation is skipped but the action still runs,
 * which is a better failure mode than a button that does nothing.
 */
export default function ConfirmButton({
  message,
  className = "ad-btn ad-btn--danger ad-btn--sm",
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
