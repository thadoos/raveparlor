import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { DEFAULT_CONTENT_V1, migrateV1toV2 } from "@/lib/content/legacy-v1";
import { contentImagePaths, parseSiteContent } from "@/lib/content/schema";

const RAVE_ID = "7b1f0c52-3a4e-4c1d-9a6b-1d2e3f4a5b61";

describe("migrateV1toV2", () => {
  const migrated = migrateV1toV2(structuredClone(DEFAULT_CONTENT_V1));
  const items = migrated.services;

  it("parses both the v2 defaults and v1 input", () => {
    expect(parseSiteContent(DEFAULT_CONTENT).ok).toBe(true);
    const r = parseSiteContent(structuredClone(DEFAULT_CONTENT_V1));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.content.version).toBe(2);
  });

  it("builds DEFAULT_CONTENT from the v1 literal", () => expect(DEFAULT_CONTENT).toEqual(migrated));

  it("moves cut prices into the cutting item, per barber", () => {
    const cutting = items.cut.items.cutting;
    expect(cutting.options).toEqual(["Gentleman", "Ladies", "Under 12s"]);
    expect(cutting.byBarber).toBe(true);
    expect(cutting.prices.base).toBeUndefined();
    expect(cutting.prices.barbers?.[RAVE_ID]).toEqual(["£55", "£80", "£35"]);
    expect(migrated.barbers[0]).not.toHaveProperty("cutPrices");
  });

  it("gives every barber the old range for cleansing", () => {
    const cleansing = items.cut.items.cleansing;
    expect(cleansing.byBarber).toBe(true);
    expect(cleansing.options).toEqual([]);
    const rows = Object.values(cleansing.prices.barbers ?? {});
    expect(rows).toHaveLength(migrated.barbers.length);
    for (const row of rows) expect(row).toEqual(["£30 – £40"]);
  });

  it("maps table items to options with base prices", () => {
    const roots = items.colour.items.roots;
    expect(roots.byBarber).toBe(false);
    expect(roots.options).toEqual(["Short", "Medium", "Long"]);
    expect(roots.prices).toEqual({ base: ["£80", "–", "–"] });
    expect(items.perm.items.halfPerm.options).toEqual(["Short"]);
  });

  it("maps range items to a single base price", () => {
    const olaplex = items.treat.items.olaplex;
    expect(olaplex.options).toEqual([]);
    expect(olaplex.byBarber).toBe(false);
    expect(olaplex.prices).toEqual({ base: ["£30"] });
  });

  it("copies the category dialog photos into each item", () => {
    const expected = [
      DEFAULT_CONTENT_V1.images["dialog.cut.0"],
      DEFAULT_CONTENT_V1.images["dialog.cut.1"],
    ];
    for (const item of Object.values(items.cut.items)) expect(item.photos).toEqual(expected);
  });

  it("drops the dialog image slots", () => {
    expect(migrated.images).not.toHaveProperty("dialog.cut.0");
    expect(Object.keys(migrated.images)).toHaveLength(13);
  });

  it("does not mutate its input", () => {
    const input = structuredClone(DEFAULT_CONTENT_V1);
    migrateV1toV2(input);
    expect(input).toEqual(DEFAULT_CONTENT_V1);
  });
});

describe("contentImagePaths", () => {
  it("lists slot images and item photos", () => {
    const paths = contentImagePaths(DEFAULT_CONTENT);
    expect(paths).toContain("/images/price-list.webp");
    for (const photo of DEFAULT_CONTENT.services.cut.items.cutting.photos)
      expect(paths).toContain(photo.path);
  });

  it("includes uploaded item photos", () => {
    const c = structuredClone(DEFAULT_CONTENT);
    const path = "item.colour.roots/0f8fad5b-d9cb-469f-a165-70867728950e.webp";
    c.services.colour.items.roots.photos[0] = { ...c.services.colour.items.roots.photos[0], path };
    expect(contentImagePaths(c)).toContain(path);
  });
});
