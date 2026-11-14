import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { jost } from "@/lib/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  colorScheme: "light",
};

/** Root layout for /preview: the site's document (font, global styles) without its SEO data. */
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={jost.variable}>
      <body>{children}</body>
    </html>
  );
}
