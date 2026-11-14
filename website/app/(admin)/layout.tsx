import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { jost } from "@/lib/fonts";
import "../styles/tokens.css";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

/** Root layout for /admin. Static on purpose: pages read the session inside their own <Suspense>. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={jost.variable}>
      <body>{children}</body>
    </html>
  );
}
