import { describe, expect, it } from "vitest";
import { BOOK_MESSAGE, WHATSAPP_NUMBER, serviceMessage, whatsappLink } from "@/lib/contact";

describe("serviceMessage", () => {
  it("names the barber and the cut when a barber is chosen", () => {
    expect(
      serviceMessage({
        service: "Cutting & Finishing",
        barber: "Rave",
        chooseBarber: true,
        cut: "Gentleman",
      }),
    ).toBe("Hi, I'd like to book Cutting and Finishing (Gentleman) with Rave.");
  });

  it("says any barber is fine when there is no preference", () => {
    expect(
      serviceMessage({ service: "Up-do Hairdressing", barber: null, chooseBarber: true }),
    ).toBe("Hi, I'd like to book Up-do Hairdressing. Any barber is fine.");
  });

  it("leaves the barber out for a service without per-barber prices", () => {
    expect(
      serviceMessage({
        service: "Full Head Colour",
        barber: null,
        chooseBarber: false,
        cut: "Medium length",
      }),
    ).toBe("Hi, I'd like to book Full Head Colour (Medium length).");
    expect(
      serviceMessage({ service: "Ion Straightening", barber: "Rave", chooseBarber: false }),
    ).toBe("Hi, I'd like to book Ion Straightening.");
  });

  it("includes the cut when there is no barber preference", () => {
    expect(
      serviceMessage({
        service: "Cutting & Finishing",
        barber: null,
        chooseBarber: true,
        cut: "Ladies",
      }),
    ).toBe("Hi, I'd like to book Cutting and Finishing (Ladies). Any barber is fine.");
  });

  it("replaces every ' & ' with ' and '", () => {
    const message = serviceMessage({
      service: "Kérastase Scalp Relax Spa & Serum & More",
      barber: null,
      chooseBarber: false,
    });
    expect(message).toBe("Hi, I'd like to book Kérastase Scalp Relax Spa and Serum and More.");
    expect(message).not.toContain("&");
  });
});

describe("whatsappLink", () => {
  it("links to the salon number without a message", () => {
    expect(whatsappLink()).toBe(`https://wa.me/${WHATSAPP_NUMBER}`);
    expect(WHATSAPP_NUMBER).toBe("447789096148");
  });

  it("url-encodes the message", () => {
    const link = whatsappLink("Hi, I'd like to book Cutting and Finishing (Gentleman).");
    expect(link).toBe(
      "https://wa.me/447789096148?text=Hi%2C%20I'd%20like%20to%20book%20Cutting%20and%20Finishing%20(Gentleman).",
    );
  });

  it("encodes the general booking message", () => {
    expect(BOOK_MESSAGE).toBe("Hi, I'd like to book an appointment at Rave's Parlor.");
    expect(whatsappLink(BOOK_MESSAGE)).toBe(
      `https://wa.me/447789096148?text=${encodeURIComponent(BOOK_MESSAGE)}`,
    );
  });
});
