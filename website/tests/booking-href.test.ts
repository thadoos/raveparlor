import { describe, expect, it } from "vitest";
import { bookingHref, bookingMessage } from "@/lib/booking/href";
import { whatsappLink } from "@/lib/contact";
import { MENU, type CategoryKey, type MenuItem } from "@/lib/data/services";

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
        category: MENU.cut,
        selection: { barber: "Julian", cut: "Ladies", row: 2, col: 1 },
      }),
    ).toBe("Hi, I'd like to book Cutting and Finishing (Ladies) with Julian.");
  });

  it("says any barber is fine for 'No preference'", () => {
    expect(
      bookingMessage({
        item: cutting,
        category: MENU.cut,
        selection: { barber: null, cut: "Gentleman", row: 3, col: 0 },
      }),
    ).toBe("Hi, I'd like to book Cutting and Finishing (Gentleman). Any barber is fine.");
  });

  it("asks for a barber on every service in a category with barbers, before any pick", () => {
    expect(
      bookingMessage({
        item: item("cut", "Up-do Hairdressing"),
        category: MENU.cut,
        selection: null,
      }),
    ).toBe("Hi, I'd like to book Up-do Hairdressing. Any barber is fine.");
    expect(
      bookingMessage({
        item: item("cut", "Up-do Hairdressing"),
        category: MENU.cut,
        selection: { barber: "Rave", cut: null, row: 0, col: 0 },
      }),
    ).toBe("Hi, I'd like to book Up-do Hairdressing with Rave.");
  });

  it("uses the hair length for services with length choices and no barber", () => {
    expect(
      bookingMessage({
        item: item("colour", "Full Head Colour"),
        category: MENU.colour,
        selection: { barber: null, cut: "Medium length", row: 0, col: 1 },
      }),
    ).toBe("Hi, I'd like to book Full Head Colour (Medium length).");
  });

  it("is the plain service message when there is nothing to choose", () => {
    expect(
      bookingMessage({
        item: item("colour", "Root Retouching"),
        category: MENU.colour,
        selection: null,
      }),
    ).toBe("Hi, I'd like to book Root Retouching.");
    expect(
      bookingMessage({
        item: item("treat", "Olaplex No.1 & No.2"),
        category: MENU.treat,
        selection: null,
      }),
    ).toBe("Hi, I'd like to book Olaplex No.1 and No.2.");
  });
});

describe("bookingHref", () => {
  it("is a WhatsApp link with the message", () => {
    const options = {
      item: item("perm", "Ion Straightening"),
      category: MENU.perm,
      selection: null,
    };
    expect(bookingHref(options)).toBe(whatsappLink(bookingMessage(options)));
    expect(bookingHref(options)).toContain("https://wa.me/");
  });
});
