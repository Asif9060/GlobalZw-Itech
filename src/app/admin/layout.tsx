import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";

/**
 * Admin portal shell.
 *
 * This is a *root-adjacent* layout: `app/layout.tsx` provides the document and
 * fonts, and this file adds only the portal's own stylesheet plus the
 * `.admin-root` wrapper every rule in `admin.css` is scoped to.
 *
 * The wrapper is what keeps the portal isolated. The landing pages' stylesheet
 * styles bare `header`, `button`, `input` and `body` elements, and once the
 * browser has loaded it (navigating from `/` to `/admin`, say) those rules are
 * still in the document. Scoping under a unique element, and resetting the
 * handful of elements the portal does use, means the portal looks identical
 * either way.
 *
 * Authentication is NOT handled here: the login screen lives under this layout
 * too. The guard sits in the `(dashboard)` group instead, so this file can stay
 * a static shell.
 */

export const metadata: Metadata = {
  title: "Admin Portal",
  // The portal should never appear in search results.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="admin-root">{children}</div>;
}
