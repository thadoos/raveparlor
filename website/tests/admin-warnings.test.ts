import { describe, expect, it } from "vitest";
import { setOptions, setPrice } from "@/lib/admin/draft-ops";
import { contentWarnings } from "@/lib/admin/warnings";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import type { SiteContent } from "@/lib/content/schema";

function content(): SiteContent {
  return structuredClone(DEFAULT_CONTENT);
}

function warningsFor(edit: (c: SiteContent) => void) {
  const draft = content();
  edit(draft);
  return contentWarnings(content(), draft);
}

describe("contentWarnings", () => {
  it("gives exactly one poster warning when a price changes", () => {
    const published = content();
    const warnings = contentWarnings(
      published,
      setPrice(published, "cut", "cutting", published.barbers[0].id, 0, "£60"),
    );
    expect(warnings).toEqual([
      {
        kind: "poster",
        message: "Prices changed. Remember to upload an updated price poster.",
        target: { kind: "image", slot: "priceList" },
      },
    ]);
  });

  it("gives a poster warning for base prices and options", () => {
    expect(
      warningsFor((c) => (c.services.colour.items.roots.prices = { base: ["£85", "–", "–"] })),
    ).toHaveLength(1);
    const published = content();
    const renamed = setOptions(published, "colour", "roots", ["S", "M", "L"], [0, 1, 2]);
    expect(contentWarnings(published, renamed).map((w) => w.kind)).toEqual(["poster"]);
  });

  it("gives no poster warning when the price poster was replaced too", () => {
    const warnings = warningsFor((c) => {
      c.services.cut.items.cutting.prices.barbers![c.barbers[0].id][0] = "£60";
      c.images.priceList = { ...c.images.priceList, path: "price-list/new.webp" };
    });
    expect(warnings).toEqual([]);
  });

  it("warns about every copy field that still names a removed barber", () => {
    const warnings = warningsFor((c) => {
      c.barbers.splice(1, 1);
      c.images.priceList = { ...c.images.priceList, path: "price-list/new.webp" };
    });
    expect(warnings.every((w) => w.kind === "staleBarberName")).toBe(true);
    expect(warnings.map((w) => w.message)).toEqual([
      "Cut & Style intro (paragraph 2) mentions John, who is no longer a barber.",
      "Cutting & Finishing description mentions John, who is no longer a barber.",
      "Cleansing & Styling note mentions John, who is no longer a barber.",
      "Up-do Hairdressing note mentions John, who is no longer a barber.",
    ]);
    expect(warnings.map((w) => w.target)).toEqual([
      { kind: "intro", category: "cut" },
      { kind: "item", category: "cut", item: "cutting" },
      { kind: "item", category: "cut", item: "cleansing" },
      { kind: "item", category: "cut", item: "updo" },
    ]);
  });

  it("gives no warnings when nobody is removed", () => {
    expect(contentWarnings(content(), content())).toEqual([]);
  });

  it("matches whole words only", () => {
    const published = content();
    published.barbers.push({
      id: "0e4c3f85-6d71-4f40-8d9e-4a5b6c7d8e94",
      name: "Al",
      days: "Mon",
      whatsApp: "447700900123",
    });
    const draft = content();
    draft.services.cut.intro[0] = "Also available for events.";
    draft.images.priceList = { ...draft.images.priceList, path: "price-list/new.webp" };
    expect(contentWarnings(published, draft)).toEqual([]);

    draft.services.cut.intro[0] = "Ask al, or anyone.";
    expect(contentWarnings(published, draft).map((w) => w.message)).toEqual([
      "Cut & Style intro (paragraph 1) mentions Al, who is no longer a barber.",
    ]);
  });
});
