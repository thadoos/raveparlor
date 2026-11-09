import { describe, expect, it } from "vitest";
import { SITE, resolveSiteUrl } from "@/lib/data/site";
import { buildHairSalonLd, e164, serializeJsonLd } from "@/lib/seo";

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

describe("e164", () => {
  it("prefixes the international number with a plus", () => {
    expect(e164("447789096148")).toBe("+447789096148");
  });
});

describe("buildHairSalonLd", () => {
  const ld = buildHairSalonLd("https://example.com");

  it("describes the salon", () => {
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("HairSalon");
    expect(ld.name).toBe(SITE.brandName);
    expect(ld.url).toBe("https://example.com");
    expect(ld.image).toBe("https://example.com/images/parlor-reception.jpg");
    expect(ld.telephone).toBe("+447789096148");
    expect(ld.sameAs).toEqual([SITE.instagramUrl]);
    expect(ld.hasMap).toBe(SITE.mapsUrl);
  });

  it("builds a postal address", () => {
    expect(ld.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.town,
      postalCode: SITE.address.postcode,
      addressCountry: "GB",
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

  it("makes no rating, review or price claims", () => {
    expect(ld).not.toHaveProperty("aggregateRating");
    expect(ld).not.toHaveProperty("review");
    expect(ld).not.toHaveProperty("priceRange");
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so the data cannot close the script tag", () => {
    const out = serializeJsonLd({ name: "</script><b>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({ name: "</script><b>" });
  });
});
