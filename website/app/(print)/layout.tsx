// Dev-only price list PDF export (/prices.pdf). Not served in production.
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { jost } from "@/lib/fonts";
import "../globals.css";
import "./print.css";

export const metadata: Metadata = { title: "Price List", robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: "#111111", colorScheme: "light" };

export default function PrintLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={jost.variable}>
      <body>{children}</body>
    </html>
  );
}
