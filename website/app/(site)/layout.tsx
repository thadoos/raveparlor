import type { Metadata, Viewport } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { SkipLink } from "@/components/layout/SkipLink";
import { getSiteView } from "@/lib/content/published";
import { SITE_URL } from "@/lib/data/site";
import { jost } from "@/lib/fonts";
import { formatHoursSummary } from "@/lib/format";
import { buildHairSalonLd } from "@/lib/seo";
import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getSiteView();
  const description = `Hair salon in ${site.address.town}, London. Cut, colour, perm and treatments, by appointment. Open ${formatHoursSummary(site, ", ")}.`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: site.brandName, template: `%s | ${site.brandName}` },
    description,
    alternates: { canonical: "/" },
    // Stop mobile browsers wrapping the phone number in a link before hydration (causes a mismatch)
    formatDetection: { telephone: false },
    openGraph: {
      type: "website",
      siteName: site.brandName,
      locale: "en_GB",
      title: site.brandName,
      description,
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title: site.brandName,
      description,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#111111",
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const view = await getSiteView();
  return (
    <html lang="en" className={jost.variable}>
      <body>
        <SkipLink />
        {children}
        <JsonLd data={buildHairSalonLd(view.site, view.images.parlor)} />
      </body>
    </html>
  );
}
