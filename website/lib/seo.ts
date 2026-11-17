import type { ResolvedImage } from "@/lib/content/view";
import { isPrice, type MenuCategory, type MenuItem } from "@/lib/data/services";
import { SITE_URL,type DayOfWeek, type SiteInfo } from "@/lib/data/site";

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

export interface GeoCoordinatesLd {
  "@type": "GeoCoordinates";
  latitude: number;
  longitude: number;
}

export interface CityLd {
  "@type": "City";
  name: string;
}

export interface AggregateRatingLd {
  "@type": "AggregateRating";
  ratingValue: string;
  reviewCount: number;
  bestRating: string;
}

export interface OfferLd {
  "@type": "Offer";
  itemOffered: { "@type": "Service"; name: string; description: string };
  priceSpecification?: { "@type": "PriceSpecification"; priceCurrency: "GBP"; minPrice: number };
}

export interface OfferCatalogLd {
  "@type": "OfferCatalog";
  name: string;
  itemListElement: readonly (OfferLd | OfferCatalogLd)[];
}

export interface HairSalonLd {
  "@context": "https://schema.org";
  "@type": "HairSalon";
  "@id": string;
  name: string;
  url: string;
  image: string;
  logo: string;
  priceRange?: string;
  areaServed: readonly CityLd[];
  aggregateRating: AggregateRatingLd;
  hasOfferCatalog: OfferCatalogLd;
  telephone: string;
  address: PostalAddressLd;
  geo: GeoCoordinatesLd;
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

/** Every £ amount in the menu's price cells (e.g. "£100 – £220+" gives 100 and 220). */
function menuAmounts(items: readonly MenuItem[]): number[] {
  return items.flatMap((item) =>
    item.rows.flatMap((row) =>
      row.prices.filter(isPrice).flatMap((price) =>
        Array.from(price.matchAll(/£(\d+)/g), (m) => Number(m[1])),
      ),
    ),
  );
}

/**
 * The price range of the menu as text, e.g. "£30 - £220+" (lowest to highest £ amount; "+" when
 * the highest is an open-ended "£220+"). Undefined when no price cell has an amount.
 */
export function buildPriceRange(menu: Readonly<Record<string, MenuCategory>>): string | undefined {
  const items = Object.values(menu).flatMap((category) => category.items);
  const amounts = menuAmounts(items);
  if (amounts.length === 0) return undefined;
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const openEnded = items.some((item) =>
    item.rows.some((row) => row.prices.some((price) => price.includes(`£${max}+`))),
  );
  return `£${min} - £${max}${openEnded ? "+" : ""}`;
}

function buildOffer(item: MenuItem): OfferLd {
  const amounts = menuAmounts([item]);
  const offer: OfferLd = {
    "@type": "Offer",
    itemOffered: { "@type": "Service", name: item.name, description: item.desc },
  };
  if (amounts.length > 0) {
    offer.priceSpecification = {
      "@type": "PriceSpecification",
      priceCurrency: "GBP",
      minPrice: Math.min(...amounts),
    };
  }
  return offer;
}

/**
 * The salon as JSON-LD. `image` is the parlor photo; `menu` feeds the price range and the service
 * catalog; `siteUrl` is the canonical origin (defaults to `SITE_URL`).
 */
export function buildHairSalonLd(
  site: SiteInfo,
  image: ResolvedImage,
  menu: Readonly<Record<string, MenuCategory>>,
  siteUrl: string = SITE_URL,
): HairSalonLd {
  const priceRange = buildPriceRange(menu);
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${siteUrl}/#salon`,
    name: site.brandName,
    url: siteUrl,
    image: absoluteUrl(image.src, siteUrl),
    logo: absoluteUrl("/images/logo.png", siteUrl),
    ...(priceRange !== undefined && { priceRange }),
    areaServed: [
      { "@type": "City", name: site.address.town },
      { "@type": "City", name: "London" },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: site.googleRating.score,
      reviewCount: site.googleRating.reviews,
      bestRating: "5",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: Object.values(menu).map((category) => ({
        "@type": "OfferCatalog",
        name: category.name,
        itemListElement: category.items.map(buildOffer),
      })),
    },
    telephone: e164(site.whatsappNumber),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.town,
      postalCode: site.address.postcode,
      addressCountry: "GB",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.latitude,
      longitude: site.geo.longitude,
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
