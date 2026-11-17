import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { buildSiteView } from "@/lib/content/view";
import type { MenuCategory, MenuItem } from "@/lib/data/services";
import { resolveSiteUrl } from "@/lib/data/site";
import {
  buildHairSalonLd,
  buildPriceRange,
  e164,
  serializeJsonLd,
  type OfferCatalogLd,
} from "@/lib/seo";

describe("resolveSiteUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://example.com",
        VERCEL_PROJECT_PRODUCTION_URL: "vercel.example.app",
      }),
    ).toBe("https://example.com");
  });

  it("falls back to the Vercel production domain over https", () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "vercel.example.app" })).toBe(
      "https://vercel.example.app",
    );
  });

  it("falls back to localhost when nothing is set", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });

  it("treats empty values as unset and strips trailing slashes", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "  ", VERCEL_PROJECT_PRODUCTION_URL: "" })).toBe(
      "http://localhost:3000",
    );
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://example.com//" })).toBe(
      "https://example.com",
    );
  });
});

const view = buildSiteView(DEFAULT_CONTENT, "");

describe("e164", () => {
  it("prefixes the international number with a plus", () => {
    expect(e164("447789096148")).toBe("+447789096148");
  });
});

describe("buildHairSalonLd", () => {
  const site = view.site;
  const ld = buildHairSalonLd(site, view.images.parlor, view.menu, "https://example.com");

  it("describes the salon", () => {
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("HairSalon");
    expect(ld.name).toBe(site.brandName);
    expect(ld.url).toBe("https://example.com");
    expect(ld.image).toBe("https://example.com/images/parlor-reception.jpg");
    expect(ld.telephone).toBe("+447789096148");
    expect(ld.sameAs).toEqual([site.instagramUrl]);
    expect(ld.hasMap).toBe(site.mapsUrl);
  });

  it("builds a postal address", () => {
    expect(ld.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.town,
      postalCode: site.address.postcode,
      addressCountry: "GB",
    });
  });

  it("includes the geo coordinates", () => {
    expect(ld.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: 51.404722013891806,
      longitude: -0.2568717066286711,
    });
  });

  it("derives opening hours from the structured data", () => {
    expect(ld.openingHoursSpecification).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday"],
        opens: "10:00",
        closes: "18:00",
      },
    ]);
  });

  it("keeps an absolute (Storage-backed) parlor image URL as it is", () => {
    const stored = buildSiteView(
      {
        ...DEFAULT_CONTENT,
        images: {
          ...DEFAULT_CONTENT.images,
          parlor: { path: "parlor/reception.jpg", alt: "Reception", width: 1253, height: 832 },
        },
      },
      "https://project.supabase.co",
    );
    expect(buildHairSalonLd(site, stored.images.parlor, stored.menu, "https://example.com").image).toBe(
      "https://project.supabase.co/storage/v1/object/public/site-images/parlor/reception.jpg",
    );
  });

  it("identifies the salon and its logo", () => {
    expect(ld["@id"]).toBe("https://example.com/#salon");
    expect(ld.logo).toBe("https://example.com/images/logo.png");
  });

  it("lists the areas served", () => {
    expect(ld.areaServed).toEqual([
      { "@type": "City", name: site.address.town },
      { "@type": "City", name: "London" },
    ]);
  });

  it("reports the Google rating", () => {
    expect(ld.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: site.googleRating.score,
      reviewCount: site.googleRating.reviews,
      bestRating: "5",
    });
    expect(typeof ld.aggregateRating.reviewCount).toBe("number");
  });

  it("derives the price range from the menu", () => {
    expect(ld.priceRange).toBe(buildPriceRange(view.menu));
    expect(ld.priceRange).toMatch(/^£\d+ - £\d+\+?$/);
  });

  it("omits priceRange when the menu has no prices", () => {
    expect(buildHairSalonLd(site, view.images.parlor, {}, "https://example.com")).not.toHaveProperty(
      "priceRange",
    );
  });

  it("builds a service catalog with one sub-catalog per category", () => {
    const catalog = ld.hasOfferCatalog;
    expect(catalog["@type"]).toBe("OfferCatalog");
    expect(catalog.name).toBe("Services");
    expect(catalog.itemListElement.map((c) => (c as OfferCatalogLd).name)).toEqual(
      Object.values(view.menu).map((c) => c.name),
    );
    const first = catalog.itemListElement[0] as OfferCatalogLd;
    const item = Object.values(view.menu)[0].items[0];
    expect(first.itemListElement[0]).toMatchObject({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: item.name, description: item.desc },
    });
  });
});

/** A menu with one item per entry, each with a single row of the given price cells. */
function menuOf(...prices: string[][]): Record<string, MenuCategory> {
  const base = view.menu.cut;
  const items: MenuItem[] = prices.map((cells, i) => ({
    ...base.items[0],
    key: `item-${i}`,
    name: `Item ${i}`,
    rows: [{ label: "", sub: "", prices: cells, barberId: null }],
  }));
  return { cat: { ...base, name: "Cat", items } };
}

describe("buildPriceRange", () => {
  it("spans the lowest to the highest amount", () => {
    expect(buildPriceRange(menuOf(["£80"], ["£30", "£45"]))).toBe("£30 - £80");
  });

  it("marks an open-ended highest price with a plus", () => {
    expect(buildPriceRange(menuOf(["£30"], ["£100 – £220+"]))).toBe("£30 - £220+");
  });

  it("ignores empty cells", () => {
    expect(buildPriceRange(menuOf(["–", "£50"], ["-"]))).toBe("£50 - £50");
  });

  it("is undefined without any price", () => {
    expect(buildPriceRange(menuOf(["–"]))).toBeUndefined();
    expect(buildPriceRange({})).toBeUndefined();
  });
});

describe("hasOfferCatalog offers", () => {
  const site = view.site;

  it("uses the lowest price of the item and omits it when there is none", () => {
    const ld = buildHairSalonLd(site, view.images.parlor, menuOf(["£100 – £220+", "£60"], ["–"]));
    const offers = (ld.hasOfferCatalog.itemListElement[0] as OfferCatalogLd).itemListElement;
    expect(offers[0]).toMatchObject({
      priceSpecification: { "@type": "PriceSpecification", priceCurrency: "GBP", minPrice: 60 },
    });
    expect(offers[1]).not.toHaveProperty("priceSpecification");
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so the data cannot close the script tag", () => {
    const out = serializeJsonLd({ name: "</script><b>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({ name: "</script><b>" });
  });
});
