import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import localFont from "next/font/local";
import "@/app/globals.css";
import { QuoteModalProvider } from "@/components/catalogue/QuoteModal";
import { PageLoadProvider } from "@/components/layout/PageLoadProvider";
import { LenisProvider } from "@/components/layout/LenisProvider";

/* ── Fonts ── */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

/* General Sans loaded from Fontshare CDN via @font-face */
const generalSans = localFont({
  src: [
    { path: "../public/fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Citiply — Premium Architectural Materials",
  description:
    "Veneer, plywood, and doors that shape the mood of a space. Explore curated collections for architects and designers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${generalSans.variable}`}>
      <body className="font-sans antialiased">
        <LenisProvider>
          <PageLoadProvider>
            <QuoteModalProvider>
              {children}
            </QuoteModalProvider>
          </PageLoadProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
