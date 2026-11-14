import { describe, expect, it } from "vitest";
import { deepEqual, summarizeChanges } from "@/lib/admin/changes";
import {
  addBarber,
  addItemPhoto,
  removeBarber,
  removeItemPhoto,
  setByBarber,
  setItemPhoto,
  setItemPhotoAlt,
  setOptions,
} from "@/lib/admin/draft-ops";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import type { SiteContent } from "@/lib/content/schema";

const NEW_ID = "0e4c3f85-6d71-4f40-8d9e-4a5b6c7d8e94";
const [RAVE, JOHN] = DEFAULT_CONTENT.barbers;
const MIA = { name: "Mia", days: "Mon", whatsApp: "447700900123" };
const PHOTO = { path: "item.cut.updo/new.webp", alt: "Up-do", width: 800, height: 1000 };

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
    expect(
      changed((c) => (c.services.cut.items.cutting.prices.barbers![RAVE.id][0] = "£60")),
    ).toEqual(["Cutting & Finishing: prices changed"]);
  });

  it("reports a base price change", () => {
    expect(
      changed(
        (c) => (c.services.colour.items.fullColour.prices = { base: ["£85", "£100", "£120"] }),
      ),
    ).toEqual(["Full Head Colour: prices changed"]);
  });

  it("reports changed options only, when cells move with their labels", () => {
    expect(
      changed((c) => {
        const after = setOptions(
          c,
          "cut",
          "cutting",
          ["Under 12s", "Gentleman", "Teens"],
          [2, 0, null],
        );
        c.services = after.services;
      }),
    ).toEqual(["Cutting & Finishing: options changed"]);
  });

  it("reports a price change under a renamed option", () => {
    expect(
      changed((c) => {
        c.services.colour.items.roots.options[0] = "short";
        c.services.colour.items.roots.prices.base![0] = "£85";
      }),
    ).toEqual(["Root Retouching: options changed", "Root Retouching: prices changed"]);
  });

  it("reports the barber option turned on without a price change", () => {
    expect(changed((c) => (c.services = setByBarber(c, "colour", "roots", true).services))).toEqual(
      ["Root Retouching: barber option turned on"],
    );
  });

  it("reports the barber option turned off, with prices when other rows differed", () => {
    expect(
      changed((c) => (c.services = setByBarber(c, "cut", "cleansing", false).services)),
    ).toEqual(["Cleansing & Styling: barber option turned off"]);
    expect(changed((c) => (c.services = setByBarber(c, "cut", "cutting", false).services))).toEqual(
      ["Cutting & Finishing: barber option turned off", "Cutting & Finishing: prices changed"],
    );
  });

  it("reports only the barber when one is added or removed", () => {
    expect(changed((c) => Object.assign(c, addBarber(c, MIA, NEW_ID)))).toEqual([
      "Added barber Mia",
    ]);
    expect(changed((c) => Object.assign(c, removeBarber(c, JOHN.id)))).toEqual([
      "Removed barber John",
    ]);
  });

  it("reports item photo changes", () => {
    expect(changed((c) => Object.assign(c, setItemPhoto(c, "cut", "updo", 0, PHOTO)))).toEqual([
      "Up-do Hairdressing: photo replaced",
    ]);
    expect(changed((c) => Object.assign(c, removeItemPhoto(c, "cut", "updo", 0)))).toEqual([
      "Up-do Hairdressing: photo removed",
    ]);
    const one = removeItemPhoto(content(), "cut", "updo", 1);
    expect(summarizeChanges(one, addItemPhoto(one, "cut", "updo", PHOTO))).toEqual([
      "Up-do Hairdressing: photo added",
    ]);
    expect(
      changed((c) => Object.assign(c, setItemPhotoAlt(c, "cut", "updo", 1, "New alt"))),
    ).toEqual(["Up-do Hairdressing: photo alt text changed"]);
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
      c.services.cut.items.cutting.prices.barbers![RAVE.id][0] = "£60";
      Object.assign(c, removeBarber(c, JOHN.id));
    });
    expect(lines).toEqual([
      "Removed barber John",
      "Cutting & Finishing: prices changed",
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
