import type { NextConfig } from "next";

/**
 * The pages in `public/` are plain standalone HTML documents — they are the
 * frontend of this project and are intentionally NOT React components.
 *
 * Routing mirrors a normal Next.js app:
 *
 *   /                     -> public/landing.html
 *   /about                -> public/about.html
 *   /services-and-projects -> public/services-and-projects.html
 *   /products-and-solutions -> public/products-and-solutions.html
 *   /shop                  -> public/shop.html
 *   /traffic-solutions    -> public/traffic-solutions.html
 *   /solar-solutions      -> public/solar-solutions.html
 *   /led-lighting         -> public/led-lighting.html
 *   /engineering-consulting -> public/engineering-consulting.html
 *
 * The file-based `.html` URLs redirect to those clean URLs so the address bar
 * never shows a file extension. API routes live under `src/app/api/**`.
 */
const pages = [
  "landing",
  "about",
  "services-and-projects",
  "products-and-solutions",
  "shop",
  "traffic-solutions",
  "solar-solutions",
  "led-lighting",
  "engineering-consulting",
];

const cleanUrl = (page: string) => (page === "landing" ? "/" : `/${page}`);

const nextConfig: NextConfig = {
  // The admin product form sends several images inline (stored as data URIs),
  // which outruns the 1MB Server Action default.
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  async redirects() {
    // old file-based URLs keep working, but always land on the clean URL
    return pages.map((page) => ({
      source: `/${page}.html`,
      destination: cleanUrl(page),
      permanent: true,
    }));
  },

  async rewrites() {
    return {
      beforeFiles: pages.map((page) => ({
        source: cleanUrl(page),
        destination: `/${page}.html`,
      })),
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
