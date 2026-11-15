import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { parseSiteContent } from "@/lib/content/schema";
import type { SiteContent } from "@/lib/content/schema";
import { MENU_STRUCTURE } from "@/lib/content/structure";
import { buildSiteView, deriveFrom, resolveImage } from "@/lib/content/view";

const URL = "https://x.supabase.co";
const view = buildSiteView(DEFAULT_CONTENT, URL);

function from(category: keyof typeof view.menu, key: string): string | undefined {
  return view.menu[category].items.find((i) => i.key === key)?.from;
}

describe("DEFAULT_CONTENT", () => {
  it("passes the content schema", () => expect(parseSiteContent(DEFAULT_CONTENT).ok).toBe(true));

  it("has keys matching the menu structure", () => {
    for (const category of Object.keys(MENU_STRUCTURE) as (keyof typeof MENU_STRUCTURE)[]) {
      const structureKeys = MENU_STRUCTURE[category].items.map((i) => i.key).sort();
      expect(Object.keys(DEFAULT_CONTENT.services[category].items).sort()).toEqual(structureKeys);
    }
  });
});

describe("buildSiteView", () => {
  it("builds the cut table with one row per barber", () => {
    const item = view.menu.cut.items[0];
    expect(item.name).toBe("Cutting & Finishing");
    expect(item.options).toEqual(["Gentleman", "Ladies", "Under 12s"]);
    expect(item.byBarber).toBe(true);
    expect(item.collapsed).toBe(false);
    expect(item.rows).toHaveLength(3);
    expect(item.rows.map((r) => r.label)).toEqual(["Rave", "John", "Julian"]);
    expect(item.rows.map((r) => r.barberId)).toEqual(DEFAULT_CONTENT.barbers.map((b) => b.id));
    expect(item.rows[0].prices).toEqual(["£55", "£80", "£35"]);
    expect(item.rows[0].sub).toBe("Mon, Thu, Fri, Sat & Sun");
  });

  it("collapses per-barber items whose rows are identical", () => {
    const cleansing = view.menu.cut.items[1];
    expect(cleansing.key).toBe("cleansing");
    expect(cleansing.byBarber).toBe(true);
    expect(cleansing.collapsed).toBe(true);
    expect(cleansing.from).toBe("£30");
    expect(cleansing.rows).toHaveLength(3);
  });

  it("builds one unlabelled row for items without a barber axis", () => {
    const roots = view.menu.colour.items[0];
    expect(roots.key).toBe("roots");
    expect(roots.byBarber).toBe(false);
    expect(roots.collapsed).toBe(false);
    expect(roots.rows).toEqual([{ label: "", sub: "", prices: ["£80", "–", "–"], barberId: null }]);
  });

  it("resolves every item's photos", () => {
    for (const category of Object.values(view.menu)) {
      for (const item of category.items) expect(item.photos).toHaveLength(2);
    }
    const stored = structuredClone(DEFAULT_CONTENT);
    stored.services.cut.items.cutting.photos = [
      {
        path: "item.cut.cutting/00000000-0000-4000-8000-000000000000.webp",
        alt: "",
        width: 1,
        height: 1,
      },
    ];
    const photos = buildSiteView(stored, URL).menu.cut.items[0].photos;
    expect(photos.map((p) => p.src)).toEqual([
      `${URL}/storage/v1/object/public/site-images/item.cut.cutting/00000000-0000-4000-8000-000000000000.webp`,
    ]);
  });

  it("derives the from prices", () => {
    expect(from("cut", "cutting")).toBe("£30");
    expect(from("colour", "technicalHighlight")).toBe("£100");
    expect(from("colour", "roots")).toBe("£80");
    expect(from("treat", "olaplex")).toBe("£30");
    expect(from("cut", "cleansing")).toBe("£30");
  });

  it("applies the shared chemical note only where flagged", () => {
    expect(view.menu.colour.items[0].note).toBe(DEFAULT_CONTENT.sharedNotes.chemical);
    expect(view.menu.cut.items[1].note).toBe(
      "Priced for ladies. The same with Rave, John and Julian.",
    );
    expect(view.menu.treat.items[0].note).toBeUndefined();
  });

  it("follows barber order", () => {
    const content: SiteContent = {
      ...DEFAULT_CONTENT,
      barbers: [...DEFAULT_CONTENT.barbers].reverse(),
    };
    const reordered = buildSiteView(content, URL);
    expect(reordered.menu.cut.items[0].rows.map((r) => r.label)).toEqual([
      "Julian",
      "John",
      "Rave",
    ]);
    expect(reordered.barbers.map((b) => b.name)).toEqual(["Julian", "John", "Rave"]);
  });

  it("resolves positions and category media", () => {
    expect(view.images.heroLeft.position).toBe("46% 42%");
    expect(view.images.priceList.position).toBeUndefined();
    expect(view.menu.treat.media.position).toBe("40% 50%");
  });

  it("builds site info from content", () => {
    expect(view.site.whatsappNumber).toBe("447789096148");
    expect(view.site.phoneDisplay).toBe("07789 096148");
    expect(view.site.hours).toEqual(DEFAULT_CONTENT.business.hours);
  });

  it("passes the hero captions through", () => {
    expect(view.hero).toEqual(DEFAULT_CONTENT.hero);
  });

  it("passes the reviews and star count through", () => {
    expect(view.reviews.items).toEqual(DEFAULT_CONTENT.reviews.items);
    expect(view.reviews.stars).toBe(5);
  });

  it("builds the Google rating from the review stats", () => {
    expect(view.site.googleRating).toEqual({ score: "4.9", reviews: 202 });
    const content: SiteContent = {
      ...DEFAULT_CONTENT,
      reviews: { ...DEFAULT_CONTENT.reviews, score: 5, count: 7 },
    };
    expect(buildSiteView(content, URL).site.googleRating).toEqual({ score: "5.0", reviews: 7 });
  });
});

describe("resolveImage", () => {
  const ref = { path: "/images/a.jpg", alt: "a", width: 1, height: 2 };
  it("keeps bundled paths", () => expect(resolveImage(ref, URL).src).toBe("/images/a.jpg"));
  it("maps storage paths to the public bucket", () =>
    expect(resolveImage({ ...ref, path: "heroLeft/abc.webp" }, URL).src).toBe(
      "https://x.supabase.co/storage/v1/object/public/site-images/heroLeft/abc.webp",
    ));
});

describe("deriveFrom", () => {
  it("takes the lowest amount", () => {
    expect(deriveFrom(["£100 – £220+"])).toBe("£100");
    expect(deriveFrom(["£80", "–", "£60"])).toBe("£60");
  });
});
