import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

/**
 * Root layout — deliberately thin.
 *
 * It owns only what every route needs: the document shell and the two font
 * families. Route-specific stylesheets belong to the layout that needs them:
 *
 *   app/(solaris)/layout.tsx  the SOLARIS landing app, with globals.css
 *   app/admin/layout.tsx      the admin portal, with admin.css
 *
 * The split matters because the landing stylesheet styles bare `header`,
 * `button`, `input` and `body` elements for a marketing page. Loading it on the
 * admin portal would fight everything the portal tries to do.
 */

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GlobalZwItech Engineering Group",
    template: "%s · GlobalZwItech",
  },
  description:
    "Traffic solutions, solar PV, LED lighting and engineering consulting — designed, delivered and maintained by GlobalZwItech.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
