import type { Metadata, Viewport } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { SkipLink } from "@/components/layout/SkipLink";
import { POSITION_KEY, RESTORE_ATTR } from "@/lib/deck/constants";
import { getSiteView } from "@/lib/content/published";
import { SITE_URL } from "@/lib/data/site";
import { jost } from "@/lib/fonts";
import { formatHoursSummary } from "@/lib/format";
import { buildHairSalonLd } from "@/lib/seo";
import "../globals.css";

/**
 * Runs before the deck is parsed: when a refresh will restore a saved slide, hide the deck until
 * the controller has moved to it, so the first slide never flashes (see deck.css).
 */
const DECK_RESTORE_SCRIPT = `try{if(sessionStorage.getItem("${POSITION_KEY}"))document.documentElement.setAttribute("${RESTORE_ATTR}","")}catch(e){}`;

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getSiteView();
  const description = `Hair salon in ${site.address.town}, London. Cut, colour, perm and treatments, by appointment. Open ${formatHoursSummary(site, ", ")}.`;
  const title = `Rave’s Parlor | Hair Salon in ${site.address.town}, London`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${site.brandName}` },
    description,
    alternates: { canonical: "/" },
    // Stop mobile browsers wrapping the phone number in a link before hydration (causes a mismatch)
    formatDetection: { telephone: false },
    openGraph: {
      type: "website",
      siteName: site.brandName,
      locale: "en_GB",
      title,
      description,
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title,
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
    // suppressHydrationWarning: the restore script below may add an attribute before hydration
    <html lang="en" className={jost.variable} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: DECK_RESTORE_SCRIPT }} />
        <SkipLink />
        {children}
        <JsonLd data={buildHairSalonLd(view.site, view.images.parlor, view.menu)} />
      </body>
    </html>
  );
}
