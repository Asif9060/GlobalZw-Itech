"use client";

import { useSite } from "@/components/SiteProvider";

export default function Toast() {
  const { toast, toastVisible } = useSite();
  return (
    <div id="toast" className={toastVisible ? "show" : undefined}>
      <span className="ti"></span>
      <span id="toastMsg">{toast}</span>
    </div>
  );
}
