import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import SiteProvider from "@/components/SiteProvider";

/**
 * The SOLARIS single-page app.
 *
 * `public/landing.html` (and its four sibling landing pages) are the live
 * frontend — `next.config.ts` rewrites `/` to `/landing.html` before any
 * filesystem route is consulted, so this route group is currently not the one
 * visitors reach. It is kept working and self-contained: the stylesheet and the
 * providers live here rather than in the root layout, so the admin portal does
 * not inherit them.
 */

export const metadata: Metadata = {
  title: "SOLARIS Energy — Harness The Sun. Power Your Future.",
  description:
    "End-to-end solar PV, energy storage & EV charging solutions — engineered, installed and monitored by experts. 15+ years, 6,200+ systems, 90 countries of clean, reliable energy.",
};

export default function SolarisLayout({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <SiteProvider>{children}</SiteProvider>
    </SmoothScrollProvider>
  );
}
