import { describe, expect, it } from "vitest";
import { deepEqual, summarizeChanges } from "@/lib/admin/changes";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import type { SiteContent } from "@/lib/content/schema";

const NEW_ID = "0e4c3f85-6d71-4f40-8d9e-4a5b6c7d8e94";

function content(): SiteContent {
  return structuredClone(DEFAULT_CONTENT);
}

function changed(edit: (c: SiteContent) => void): string[] {
  const draft = content();
  edit(draft);
  return summarizeChanges(content(), draft);
}

describe("summarizeChanges", () => {
  it("returns [] for identical inputs", () => {
    expect(summarizeChanges(content(), content())).toEqual([]);
  });

  it("reports an added barber", () => {
    expect(
      changed((c) =>
        c.barbers.push({
          id: NEW_ID,
          name: "Mia",
          days: "Mon",
          whatsApp: "447700900123",
          cutPrices: ["£1", "£2", "£3"],
        }),
      ),
    ).toEqual(["Added barber Mia"]);
  });

  it("reports a removed barber", () => {
    expect(changed((c) => c.barbers.splice(1, 1))).toEqual(["Removed barber John"]);
  });

  it("reports reordered barbers", () => {
    expect(changed((c) => c.barbers.reverse())).toEqual(["Reordered barbers"]);
  });

  it("reports a barber price change", () => {
    expect(changed((c) => (c.barbers[0].cutPrices[0] = "£60"))).toEqual([
      "Rave: Gentleman £55 → £60",
    ]);
  });

  it("reports a table item price change", () => {
    expect(
      changed((c) => (c.services.colour.items.fullColour.prices = ["£85", "£100", "£120"])),
    ).toEqual(["Full Head Colour: prices changed"]);
  });

  it("reports an intro change", () => {
    expect(changed((c) => (c.services.cut.intro[0] = "Hello"))).toEqual([
      "Cut & Style: intro text changed",
    ]);
  });

  it("reports changed opening hours", () => {
    expect(changed((c) => (c.business.hours[0].close = "20:00"))).toEqual([
      "Opening hours changed",
    ]);
  });

  it("reports a changed default WhatsApp number", () => {
    expect(changed((c) => (c.business.defaultWhatsApp = "447700900123"))).toEqual([
      "Default WhatsApp number changed",
    ]);
  });

  it("reports a replaced photo", () => {
    expect(
      changed((c) => (c.images.heroLeft = { ...c.images.heroLeft, path: "hero/new.webp" })),
    ).toEqual(["Photo replaced: heroLeft"]);
  });

  it("reports changed alt text", () => {
    expect(changed((c) => (c.images.priceList.alt = "New alt"))).toEqual([
      "Alt text changed: priceList",
    ]);
  });

  it("orders lines as barbers, prices, copy, hours, number, images", () => {
    const lines = changed((c) => {
      c.images.priceList.alt = "New alt";
      c.business.defaultWhatsApp = "447700900123";
      c.business.hours[0].close = "20:00";
      c.services.cut.intro[0] = "Hello";
      c.barbers[0].cutPrices[0] = "£60";
      c.barbers.splice(1, 1);
    });
    expect(lines).toEqual([
      "Removed barber John",
      "Rave: Gentleman £55 → £60",
      "Cut & Style: intro text changed",
      "Opening hours changed",
      "Default WhatsApp number changed",
      "Alt text changed: priceList",
    ]);
  });
});

describe("deepEqual", () => {
  it("ignores object key order", () => {
    expect(deepEqual({ a: 1, b: [1, { c: 2, d: 3 }] }, { b: [1, { d: 3, c: 2 }], a: 1 })).toBe(
      true,
    );
  });

  it("spots differences", () => {
    expect(deepEqual({ a: [1, 2] }, { a: [1, 2, 3] })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
  });
});
