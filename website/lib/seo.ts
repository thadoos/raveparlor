import type { ResolvedImage } from "@/lib/content/view";
import { SITE_URL, type DayOfWeek, type SiteInfo } from "@/lib/data/site";

/** schema.org `HairSalon` structured data (https://schema.org/HairSalon), built from the site details. */

export interface PostalAddressLd {
  "@type": "PostalAddress";
  streetAddress: string;
  addressLocality: string;
  postalCode: string;
  addressCountry: string;
}

export interface OpeningHoursSpecificationLd {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: readonly DayOfWeek[];
  opens: string;
  closes: string;
}

export interface HairSalonLd {
  "@context": "https://schema.org";
  "@type": "HairSalon";
  name: string;
  url: string;
  image: string;
  telephone: string;
  address: PostalAddressLd;
  openingHoursSpecification: readonly OpeningHoursSpecificationLd[];
  sameAs: readonly string[];
  hasMap: string;
}

/** The WhatsApp number in E.164 form: "+447789096148". */
export function e164(whatsappNumber: string): string {
  return `+${whatsappNumber}`;
}

/** An absolute URL for `src`: a relative path is resolved against `siteUrl`, an absolute URL is kept. */
function absoluteUrl(src: string, siteUrl: string): string {
  return /^https?:\/\//i.test(src) ? src : `${siteUrl}${src}`;
}

/**
 * The salon as JSON-LD. `image` is the parlor photo; `siteUrl` is the canonical origin (defaults
 * to `SITE_URL`).
 */
export function buildHairSalonLd(
  site: SiteInfo,
  image: ResolvedImage,
  siteUrl: string = SITE_URL,
): HairSalonLd {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: site.brandName,
    url: siteUrl,
    image: absoluteUrl(image.src, siteUrl),
    telephone: e164(site.whatsappNumber),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.town,
      postalCode: site.address.postcode,
      addressCountry: "GB",
    },
    openingHoursSpecification: site.hours.map((hours) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: hours.dayOfWeek,
      opens: hours.open,
      closes: hours.close,
    })),
    sameAs: [site.instagramUrl],
    hasMap: site.mapsUrl,
  };
}

/** Serialises JSON-LD for an inline script: `<` is escaped so the data can never close the tag. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
