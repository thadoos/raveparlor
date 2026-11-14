import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { parseSiteContent } from "@/lib/content/schema";
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
        c.barbers.push({ ...c.barbers[0], id: "22222222-2222-4222-8222-222222222222", name: "RAVE" });
      }).ok,
    ).toBe(false));

  it("rejects non-normalized whatsApp", () =>
    expect(mutated((c) => (c.barbers[0].whatsApp = "07789 096148")).ok).toBe(false));

  it("rejects non-canonical cut prices", () =>
    expect(mutated((c) => (c.barbers[0].cutPrices[0] = "80")).ok).toBe(false));

  it("rejects open after close", () =>
    expect(
      mutated((c) => {
        c.business.hours[0].open = "19:00";
        c.business.hours[0].close = "10:00";
      }).ok,
    ).toBe(false));

  it("rejects lastAppointment outside open..close", () =>
    expect(mutated((c) => (c.business.hours[0].lastAppointment = "20:00")).ok).toBe(false));

  it("rejects missing image slot", () =>
    expect(mutated((c) => delete c.images.priceList).ok).toBe(false));

  it("rejects version 2", () => expect(mutated((c) => (c.version = 2)).ok).toBe(false));
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
      (c) => (c.services.treat.items.extra = { range: "£10", desc: "x", ideal: "y" }),
    );
    expect(issues).toContain("services.treat.items.extra: Unknown item");
  });

  it("rejects a table item with the wrong number of prices", () => {
    const issues = issuesOf((c) => (c.services.colour.items.roots.prices = ["£80", "–"]));
    expect(issues).toContain("services.colour.items.roots.prices: Expected 3 prices, got 2");
  });

  it("rejects a table item without prices", () => {
    const issues = issuesOf((c) => delete c.services.perm.items.halfPerm.prices);
    expect(issues).toContain("services.perm.items.halfPerm.prices: Expected 1 price, got 0");
  });

  it("rejects a range item missing range", () => {
    const issues = issuesOf((c) => delete c.services.treat.items.olaplex.range);
    expect(issues).toContain("services.treat.items.olaplex.range: Required");
  });

  it("accepts DEFAULT_CONTENT", () => expect(parseSiteContent(DEFAULT_CONTENT).ok).toBe(true));
});
