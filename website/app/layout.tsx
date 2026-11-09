import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import { SkipLink } from "@/components/layout/SkipLink";
import { SITE, SITE_URL } from "@/lib/data/site";
import { formatHoursSummary } from "@/lib/format";
import { buildHairSalonLd } from "@/lib/seo";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["200", "300", "400"],
});

const DESCRIPTION = `Hair salon in ${SITE.address.town}, London. Cut, colour, perm and treatments, by appointment. Open ${formatHoursSummary(", ")}.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE.brandName, template: `%s | ${SITE.brandName}` },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.brandName,
    locale: "en_GB",
    title: SITE.brandName,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.brandName,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={jost.variable}>
      <body>
        <SkipLink />
        {children}
        <JsonLd data={buildHairSalonLd()} />
      </body>
    </html>
  );
}
