import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import SiteProvider from "@/components/SiteProvider";

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
  title: "SOLARIS Energy — Harness The Sun. Power Your Future.",
  description:
    "End-to-end solar PV, energy storage & EV charging solutions — engineered, installed and monitored by experts. 15+ years, 6,200+ systems, 90 countries of clean, reliable energy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="loading">
        <SmoothScrollProvider>
          <SiteProvider>{children}</SiteProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
