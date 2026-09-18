"use client";

import { useSite } from "@/components/SiteProvider";

export default function SuccessVeil() {
  const { successOpen, setSuccessOpen } = useSite();

  return (
    <div id="successVeil" className={successOpen ? "open" : undefined}>
      <div className="success-card">
        <svg className="check-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" />
          <path d="M28 52l15 15 30-34" />
        </svg>
        <h3>Query sent to admin! ☀</h3>
        <p>
          Thank you — your query has been delivered to our team. A solar
          consultant will contact you within{" "}
          <b style={{ color: "#ffb703" }}>24 hours</b> with your free design
          &amp; quote.
        </p>
        <button
          className="btn-primary"
          id="successClose"
          onClick={() => setSuccessOpen(false)}
        >
          Back to site
        </button>
      </div>
    </div>
  );
}
