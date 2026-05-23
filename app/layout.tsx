import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import { QuoteModalProvider } from "@/components/catalogue/QuoteModal";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Citiply - Premium Architectural Materials Catalogue",
  description: "Digital catalogue for veneers, doors, plywood, flooring, wall panels, louvers, and laminates."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">
        <QuoteModalProvider>
          {children}
        </QuoteModalProvider>
      </body>
    </html>
  );
}
