import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import {
  DEFAULT_HERO,
  DEFAULT_REVIEWS,
  REVIEW_AUTHOR_MAX,
  REVIEW_QUOTE_MAX,
} from "@/lib/content/site-copy";
import { itemPhotoFolder, parseSiteContent } from "@/lib/content/schema";
import type { ImageRef, ImageSlot, SiteContent } from "@/lib/content/schema";

type Draft = Omit<SiteContent, "version" | "images"> & {
  version: number;
  images: Partial<Record<ImageSlot, ImageRef>>;
};

function makeContent(): Draft {
  return structuredClone(DEFAULT_CONTENT);
}

function mutated(fn: (c: ReturnType<typeof makeContent>) => void) {
  const c = makeContent();
  fn(c);
  return parseSiteContent(c);
}

describe("parseSiteContent", () => {
  it("accepts a valid fixture", () => expect(parseSiteContent(makeContent()).ok).toBe(true));

  it("requires at least one barber", () => {
    const r = mutated((c) => (c.barbers = []));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues.length).toBeGreaterThan(0);
      expect(r.issues.some((i) => i.includes("barbers"))).toBe(true);
    }
  });

  it("rejects duplicate barber names case-insensitively", () =>
    expect(
      mutated((c) => {
        c.barbers.push({
          ...c.barbers[0],
          id: "22222222-2222-4222-8222-222222222222",
          name: "RAVE",
        });
      }).ok,
    ).toBe(false));

  it("rejects non-normalized whatsApp", () =>
    expect(mutated((c) => (c.barbers[0].whatsApp = "07789 096148")).ok).toBe(false));

  it("rejects non-canonical item prices", () =>
    expect(mutated((c) => (c.services.colour.items.roots.prices.base![0] = "80")).ok).toBe(false));

  it("rejects open after close", () =>
    expect(
      mutated((c) => {
        c.business.hours[0].open = "19:00";
        c.business.hours[0].close = "10:00";
      }).ok,
    ).toBe(false));

  it("rejects lastAppointment outside open..close", () =>
    expect(mutated((c) => (c.business.hours[0].lastAppointment = "20:00")).ok).toBe(false));

  it("requires at least one opening hours entry", () => {
    const r = mutated((c) => (c.business.hours = []));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.startsWith("business.hours"))).toBe(true);
  });

  it("accepts an uploaded storage key image path", () =>
    expect(
      mutated(
        (c) =>
          (c.images.heroLeft = {
            ...c.images.heroLeft!,
            path: "heroLeft/0f8fad5b-d9cb-469f-a165-70867728950e.webp",
          }),
      ).ok,
    ).toBe(true));

  it("accepts a bundled /images path", () =>
    expect(
      mutated((c) => (c.images.heroLeft = { ...c.images.heroLeft!, path: "/images/sub/a-b_c.jpg" }))
        .ok,
    ).toBe(true));

  it.each([
    "https://x/y.jpg",
    "//host/x.jpg",
    "/",
    "heroLeft/not-a-uuid.webp",
    "heroLeft/0f8fad5b-d9cb-469f-a165-70867728950e.png",
  ])("rejects image path %s", (path) =>
    expect(mutated((c) => (c.images.heroLeft = { ...c.images.heroLeft!, path })).ok).toBe(false),
  );

  it("rejects missing image slot", () =>
    expect(mutated((c) => delete c.images.priceList).ok).toBe(false));

  it("accepts an uploaded item photo storage key", () =>
    expect(
      mutated((c) => {
        const photos = c.services.cut.items.cutting.photos;
        photos[0] = {
          ...photos[0],
          path: `${itemPhotoFolder("cut", "cutting")}/0f8fad5b-d9cb-469f-a165-70867728950e.webp`,
        };
      }).ok,
    ).toBe(true));

  it("names item photo folders item.<category>.<item>", () =>
    expect(itemPhotoFolder("cut", "cutting")).toBe("item.cut.cutting"));

  it("rejects a removed dialog image slot", () =>
    expect(
      mutated((c) => {
        (c.images as Record<string, ImageRef>)["dialog.cut.0"] = c.images.heroLeft!;
      }).ok,
    ).toBe(false));

  it("rejects version 3", () => expect(mutated((c) => (c.version = 3)).ok).toBe(false));
});

describe("parseSiteContent hero and reviews", () => {
  it("accepts a stored row without hero and reviews and fills the defaults", () => {
    const stored: Record<string, unknown> = structuredClone(DEFAULT_CONTENT);
    delete stored.hero;
    delete stored.reviews;
    const r = parseSiteContent(stored);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.content.hero).toEqual(DEFAULT_HERO);
      expect(r.content.reviews).toEqual(DEFAULT_REVIEWS);
    }
  });

  it("rejects an empty reviews list", () => {
    const r = mutated((c) => (c.reviews.items = []));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.includes("reviews.items"))).toBe(true);
  });

  it("rejects a blank hero title", () => {
    expect(mutated((c) => (c.hero.left.title = "  ")).ok).toBe(false);
    expect(mutated((c) => (c.hero.left.title = "")).ok).toBe(false);
    expect(mutated((c) => (c.hero.right.title = " ")).ok).toBe(false);
    expect(mutated((c) => (c.hero.right.title = "")).ok).toBe(false);
  });

  it("parses an old stored row that still has linkLabel and drops it", () => {
    const stored = structuredClone(DEFAULT_CONTENT) as unknown as {
      hero: { left: Record<string, unknown>; right: Record<string, unknown> };
    };
    stored.hero.left.linkLabel = "Book an appointment";
    stored.hero.right.linkLabel = "See prices";
    const r = parseSiteContent(stored);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.content.hero).toEqual(DEFAULT_HERO);
      expect(r.content.hero.left).not.toHaveProperty("linkLabel");
      expect(r.content.hero.right).not.toHaveProperty("linkLabel");
    }
  });

  it("rejects stars 0 and 6, score -0.1 and 5.1, count -1 and 1.5", () => {
    expect(mutated((c) => (c.reviews.stars = 0)).ok).toBe(false);
    expect(mutated((c) => (c.reviews.stars = 6)).ok).toBe(false);
    expect(mutated((c) => (c.reviews.score = -0.1)).ok).toBe(false);
    expect(mutated((c) => (c.reviews.score = 5.1)).ok).toBe(false);
    expect(mutated((c) => (c.reviews.count = -1)).ok).toBe(false);
    expect(mutated((c) => (c.reviews.count = 1.5)).ok).toBe(false);
  });

  it("accepts stars 1 and 5, score 0 and 5, count 0", () => {
    expect(mutated((c) => (c.reviews.stars = 1)).ok).toBe(true);
    expect(mutated((c) => (c.reviews.stars = 5)).ok).toBe(true);
    expect(mutated((c) => (c.reviews.score = 0)).ok).toBe(true);
    expect(mutated((c) => (c.reviews.score = 5)).ok).toBe(true);
    expect(mutated((c) => (c.reviews.count = 0)).ok).toBe(true);
  });

  it("rejects a blank or over-length quote and author", () => {
    expect(mutated((c) => (c.reviews.items[0].quote = " ")).ok).toBe(false);
    expect(mutated((c) => (c.reviews.items[0].author = "")).ok).toBe(false);
    expect(mutated((c) => (c.reviews.items[0].quote = "a".repeat(REVIEW_QUOTE_MAX + 1))).ok).toBe(
      false,
    );
    expect(mutated((c) => (c.reviews.items[0].author = "a".repeat(REVIEW_AUTHOR_MAX + 1))).ok).toBe(
      false,
    );
    expect(mutated((c) => (c.reviews.items[0].quote = "a".repeat(REVIEW_QUOTE_MAX))).ok).toBe(true);
    expect(mutated((c) => (c.reviews.items[0].author = "a".repeat(REVIEW_AUTHOR_MAX))).ok).toBe(
      true,
    );
  });

  it("rejects a review whose id is not a uuid", () =>
    expect(mutated((c) => (c.reviews.items[0].id = "not-a-uuid")).ok).toBe(false));
});

describe("parseSiteContent structure checks", () => {
  function issuesOf(fn: (c: Draft) => void): string[] {
    const r = mutated(fn);
    expect(r.ok).toBe(false);
    return r.ok ? [] : r.issues;
  }

  it("rejects a missing item key", () => {
    const issues = issuesOf((c) => delete c.services.colour.items.roots);
    expect(issues).toContain("services.colour.items.roots: Missing item");
  });

  it("rejects an extra item key", () => {
    const issues = issuesOf(
      (c) => (c.services.treat.items.extra = structuredClone(c.services.treat.items.olaplex)),
    );
    expect(issues).toContain("services.treat.items.extra: Unknown item");
  });

  const RAVE = "7b1f0c52-3a4e-4c1d-9a6b-1d2e3f4a5b61";
  const cutting = (c: Draft) => c.services.cut.items.cutting;

  it("rejects a byBarber item missing a barber's row", () => {
    const issues = issuesOf((c) => delete cutting(c).prices.barbers![RAVE]);
    expect(issues.some((i) => i.startsWith("services.cut.items.cutting.prices.barbers"))).toBe(
      true,
    );
  });

  it("rejects a row with an unknown barber id", () =>
    expect(
      issuesOf(
        (c) =>
          (cutting(c).prices.barbers!["33333333-3333-4333-8333-333333333333"] = ["£1", "£2", "£3"]),
      ),
    ).toContain(
      "services.cut.items.cutting.prices.barbers.33333333-3333-4333-8333-333333333333: Unknown barber",
    ));

  it("rejects base on a byBarber item", () =>
    issuesOf((c) => (cutting(c).prices.base = ["£1", "£2", "£3"])));

  it("rejects barbers on a non-byBarber item", () =>
    issuesOf(
      (c) => (c.services.colour.items.roots.prices.barbers = { [RAVE]: ["£1", "£2", "£3"] }),
    ));

  it("rejects a non-byBarber item without base", () =>
    issuesOf((c) => delete c.services.treat.items.olaplex.prices.base));

  it("rejects the wrong row length after adding an option", () => {
    const issues = issuesOf((c) => cutting(c).options.push("Kids"));
    expect(issues.some((i) => i.includes("Expected 4 prices, got 3"))).toBe(true);
  });

  it("rejects a base of the wrong length", () => {
    const issues = issuesOf((c) => (c.services.colour.items.roots.prices.base = ["£80", "–"]));
    expect(issues).toContain("services.colour.items.roots.prices.base: Expected 3 prices, got 2");
  });

  it("rejects duplicate option labels", () =>
    expect(issuesOf((c) => (c.services.colour.items.roots.options[1] = "short"))).toContain(
      'services.colour.items.roots.options.1: Duplicate option "short"',
    ));

  it("rejects an empty option label", () =>
    expect(issuesOf((c) => (c.services.colour.items.roots.options[1] = "  "))).toContain(
      "services.colour.items.roots.options.1: Option label is required",
    ));

  it("rejects an item whose cells are all –", () => {
    const issues = issuesOf((c) => (c.services.colour.items.roots.prices.base = ["–", "–", "–"]));
    expect(issues.some((i) => i.startsWith("services.colour.items.roots.prices"))).toBe(true);
  });

  it("rejects a byBarber item whose cells are all –", () =>
    issuesOf((c) => {
      for (const id of Object.keys(cutting(c).prices.barbers!))
        cutting(c).prices.barbers![id] = ["–", "–", "–"];
    }));

  it("rejects 0 photos", () =>
    issuesOf((c) => ((cutting(c) as { photos: ImageRef[] }).photos = [])));

  it("rejects 3 photos", () =>
    issuesOf((c) => {
      const photos = cutting(c).photos as ImageRef[];
      photos.push(photos[0], photos[0]);
    }));

  it("accepts a single photo", () => {
    const r = mutated((c) => (cutting(c).photos = [cutting(c).photos[0]]));
    expect(r.ok).toBe(true);
  });

  it("accepts DEFAULT_CONTENT", () => expect(parseSiteContent(DEFAULT_CONTENT).ok).toBe(true));
});
