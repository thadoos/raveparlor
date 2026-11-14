import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { buildSiteView } from "@/lib/content/view";
import { bookingHref, bookingMessage } from "@/lib/booking/href";
import { whatsappLink } from "@/lib/contact";
import type { CategoryKey, MenuItem } from "@/lib/data/services";

const JULIAN_NUMBER = "447700900123";
const DEFAULT_NUMBER = "447789096148";
const CONTENT = {
  ...DEFAULT_CONTENT,
  barbers: DEFAULT_CONTENT.barbers.map((b) =>
    b.name === "Julian" ? { ...b, whatsApp: JULIAN_NUMBER } : b,
  ),
};
const VIEW = buildSiteView(CONTENT, "");
const MENU = VIEW.menu;

function barberId(name: string): string {
  const found = CONTENT.barbers.find((b) => b.name === name);
  if (!found) throw new Error(`No barber named ${name}`);
  return found.id;
}

function item(category: CategoryKey, name: string): MenuItem {
  const found = MENU[category].items.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No menu item named ${name}`);
  return found;
}

describe("bookingMessage", () => {
  const cutting = item("cut", "Cutting & Finishing");

  it("names the barber and the cut", () => {
    expect(
      bookingMessage({
        item: cutting,
        barbers: VIEW.barbers,
        selection: { barberId: barberId("Julian"), cut: "Ladies", row: 2, col: 1 },
        defaultWhatsApp: DEFAULT_NUMBER,
      }),
    ).toBe("Hi, I'd like to book Cutting and Finishing (Ladies) with Julian.");
  });

  it("says any barber is fine for 'No preference'", () => {
    expect(
      bookingMessage({
        item: cutting,
        barbers: VIEW.barbers,
        selection: { barberId: null, cut: "Gentleman", row: 3, col: 0 },
        defaultWhatsApp: DEFAULT_NUMBER,
      }),
    ).toBe("Hi, I'd like to book Cutting and Finishing (Gentleman). Any barber is fine.");
  });

  it("names the barber picked on a single-price service", () => {
    const options = {
      item: item("cut", "Cleansing & Styling"),
      barbers: VIEW.barbers,
      selection: { barberId: barberId("Julian"), cut: null, row: 2, col: 0 },
      defaultWhatsApp: DEFAULT_NUMBER,
    };
    expect(bookingMessage(options)).toBe("Hi, I'd like to book Cleansing and Styling with Julian.");
    expect(bookingHref(options).startsWith(`https://wa.me/${JULIAN_NUMBER}?text=`)).toBe(true);
  });

  it("asks for a barber on every service with per-barber prices, before any pick", () => {
    expect(
      bookingMessage({
        item: item("cut", "Up-do Hairdressing"),
        barbers: VIEW.barbers,
        selection: null,
        defaultWhatsApp: DEFAULT_NUMBER,
      }),
    ).toBe("Hi, I'd like to book Up-do Hairdressing. Any barber is fine.");
    expect(
      bookingMessage({
        item: item("cut", "Up-do Hairdressing"),
        barbers: VIEW.barbers,
        selection: { barberId: barberId("Rave"), cut: null, row: 0, col: 0 },
        defaultWhatsApp: DEFAULT_NUMBER,
      }),
    ).toBe("Hi, I'd like to book Up-do Hairdressing with Rave.");
  });

  it("uses the hair length for services with length choices and no barber", () => {
    expect(
      bookingMessage({
        item: item("colour", "Full Head Colour"),
        barbers: VIEW.barbers,
        selection: { barberId: null, cut: "Medium length", row: 0, col: 1 },
        defaultWhatsApp: DEFAULT_NUMBER,
      }),
    ).toBe("Hi, I'd like to book Full Head Colour (Medium length).");
  });

  it("is the plain service message when there is nothing to choose", () => {
    expect(
      bookingMessage({
        item: item("colour", "Root Retouching"),
        barbers: VIEW.barbers,
        selection: null,
        defaultWhatsApp: DEFAULT_NUMBER,
      }),
    ).toBe("Hi, I'd like to book Root Retouching.");
    expect(
      bookingMessage({
        item: item("treat", "Olaplex No.1 & No.2"),
        barbers: VIEW.barbers,
        selection: null,
        defaultWhatsApp: DEFAULT_NUMBER,
      }),
    ).toBe("Hi, I'd like to book Olaplex No.1 and No.2.");
  });
});

describe("bookingHref", () => {
  it("is a WhatsApp link with the message", () => {
    const options = {
      item: item("perm", "Ion Straightening"),
      barbers: VIEW.barbers,
      selection: null,
      defaultWhatsApp: DEFAULT_NUMBER,
    };
    expect(bookingHref(options)).toBe(whatsappLink(DEFAULT_NUMBER, bookingMessage(options)));
  });

  const cutting = () => item("cut", "Cutting & Finishing");
  const base = () => ({ item: cutting(), barbers: VIEW.barbers, defaultWhatsApp: DEFAULT_NUMBER });

  it("uses the chosen barber's number", () => {
    const href = bookingHref({
      ...base(),
      selection: { barberId: barberId("Julian"), cut: "Ladies", row: 2, col: 1 },
      defaultWhatsApp: DEFAULT_NUMBER,
    });
    expect(href.startsWith(`https://wa.me/${JULIAN_NUMBER}?text=`)).toBe(true);
  });

  it("uses the default number for no preference or no selection", () => {
    const none = bookingHref({
      ...base(),
      selection: { barberId: null, cut: "Gentleman", row: 3, col: 0 },
      defaultWhatsApp: DEFAULT_NUMBER,
    });
    expect(none.startsWith(`https://wa.me/${DEFAULT_NUMBER}?text=`)).toBe(true);
    expect(
      bookingHref({ ...base(), selection: null }).startsWith(
        `https://wa.me/${DEFAULT_NUMBER}?text=`,
      ),
    ).toBe(true);
  });

  it("treats an unknown barber id as no preference", () => {
    const options = {
      ...base(),
      selection: { barberId: "missing-id", cut: "Ladies", row: 0, col: 0 },
    };
    expect(bookingHref(options).startsWith(`https://wa.me/${DEFAULT_NUMBER}?text=`)).toBe(true);
    expect(bookingMessage(options)).toBe(
      "Hi, I'd like to book Cutting and Finishing (Ladies). Any barber is fine.",
    );
  });
});
