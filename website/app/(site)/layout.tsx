import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import { SkipLink } from "@/components/layout/SkipLink";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { buildSiteView } from "@/lib/content/view";
import { SITE_URL } from "@/lib/data/site";
import { formatHoursSummary } from "@/lib/format";
import { buildHairSalonLd } from "@/lib/seo";
import "../globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["200", "300", "400"],
});

// Temporary: built from the default content until the view is fetched from the database.
const view = buildSiteView(DEFAULT_CONTENT, "");
const { site } = view;

const DESCRIPTION = `Hair salon in ${site.address.town}, London. Cut, colour, perm and treatments, by appointment. Open ${formatHoursSummary(site, ", ")}.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: site.brandName, template: `%s | ${site.brandName}` },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  // Stop mobile browsers wrapping the phone number in a link before hydration (causes a mismatch)
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: site.brandName,
    locale: "en_GB",
    title: site.brandName,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: site.brandName,
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
        <JsonLd data={buildHairSalonLd(site, view.images.parlor)} />
      </body>
    </html>
  );
}
