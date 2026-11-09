import { PHOTOS } from "@/lib/data/images";
import { SITE, SITE_URL, type DayOfWeek } from "@/lib/data/site";

/** schema.org `HairSalon` structured data (https://schema.org/HairSalon), built from `SITE`. */

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

/** The salon as JSON-LD. `siteUrl` is the canonical origin (defaults to `SITE_URL`). */
export function buildHairSalonLd(siteUrl: string = SITE_URL): HairSalonLd {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: SITE.brandName,
    url: siteUrl,
    image: `${siteUrl}${PHOTOS.parlorReception.src}`,
    telephone: e164(SITE.whatsappNumber),
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.town,
      postalCode: SITE.address.postcode,
      addressCountry: "GB",
    },
    openingHoursSpecification: SITE.hours.map((hours) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: hours.dayOfWeek,
      opens: hours.open,
      closes: hours.close,
    })),
    sameAs: [SITE.instagramUrl],
    hasMap: SITE.mapsUrl,
  };
}

/** Serialises JSON-LD for an inline script: `<` is escaped so the data can never close the tag. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
