/**
 * Download links for the enquiry log.
 *
 * Rendered as anchors rather than a fetch-and-blob button so the browser handles
 * the download natively: it works without JavaScript, it shows up in the
 * browser's own download UI, and large exports do not have to pass through
 * memory in a client component.
 */
export default function ExportLinks({
  site,
  status,
  query,
  label = "Export",
}: {
  site?: string;
  status?: string;
  query?: string;
  label?: string;
}) {
  function href(format: "csv" | "json"): string {
    const params = new URLSearchParams();
    if (site) params.set("site", site);
    if (status && status !== "all") params.set("status", status);
    if (query) params.set("q", query);
    params.set("format", format);
    return `/admin/export?${params.toString()}`;
  }

  return (
    <div className="ad-row">
      <a className="ad-btn ad-btn--sm" href={href("csv")} title={`${label} as CSV`}>
        ⬇ CSV
      </a>
      <a className="ad-btn ad-btn--sm" href={href("json")} title={`${label} as JSON`}>
        ⬇ JSON
      </a>
    </div>
  );
}
