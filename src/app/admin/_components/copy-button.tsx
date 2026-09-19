"use client";

import { useState } from "react";

/**
 * Copies a value to the clipboard — used for email addresses and reference
 * numbers, which operators paste into a CRM or mail client.
 *
 * `navigator.clipboard` needs a secure context, so the fallback keeps this
 * working over plain HTTP on a LAN address during development.
 */
export default function CopyButton({
  value,
  label,
  className = "ad-btn ad-btn--sm",
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const field = document.createElement("textarea");
        field.value = value;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        document.body.removeChild(field);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access denied — the value is on screen to copy by hand.
    }
  }

  return (
    <button type="button" className={className} onClick={copy} title={`Copy ${value}`}>
      {copied ? "✓ Copied" : label}
    </button>
  );
}
