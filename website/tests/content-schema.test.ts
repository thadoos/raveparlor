import { describe, expect, it } from "vitest";
import { IMAGE_SLOTS, parseSiteContent } from "@/lib/content/schema";

const CATS = ["cut", "colour", "perm", "treat"] as const;

function makeContent() {
  const images: Record<string, unknown> = {};
  for (const slot of IMAGE_SLOTS) {
    images[slot] = { path: "/images/x.jpg", alt: "x", width: 100, height: 100 };
  }
  return {
    version: 1,
    business: {
      defaultWhatsApp: "447789096148",
      hours: [
        {
          dayOfWeek: ["Monday", "Tuesday"],
          days: "Mon – Tue",
          shortDays: "Mon – Tue",
          open: "10:00",
          close: "19:00",
          lastAppointment: "18:00",
        },
      ],
    },
    barbers: [
      { id: "11111111-1111-4111-8111-111111111111", name: "Rave", days: "Mon – Sat", whatsApp: "447789096148", cutPrices: ["£30", "£35", "£20"] },
    ],
    services: Object.fromEntries(
      CATS.map((c) => [
        c,
        { intro: ["a", "b"], items: { Item: { prices: ["£10"], desc: "d", ideal: "i" } } },
      ]),
    ),
    sharedNotes: { chemical: "note" },
    images,
  };
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
