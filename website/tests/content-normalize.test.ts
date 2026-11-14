import { describe, expect, it } from "vitest";
import { formatUkPhone, normalizePrice, normalizeWhatsApp } from "@/lib/content/normalize";

describe("normalizeWhatsApp", () => {
  it.each(["07789 096148", "+44 7789 096148", "0044 7789 096148", "447789096148", "+44 (0)7789-096148"])(
    "normalizes %s",
    (input) => expect(normalizeWhatsApp(input)).toBe("447789096148"),
  );
  it.each(["", "hello", "0778909614", "+1 2", "07789 096148 ext 2"])("rejects %s", (input) =>
    expect(normalizeWhatsApp(input)).toBeNull(),
  );
  it("keeps other international numbers in E.164 digits", () =>
    expect(normalizeWhatsApp("+33 6 12 34 56 78")).toBe("33612345678"));
});

describe("normalizePrice", () => {
  it.each([
    ["80", "£80"],
    ["£80", "£80"],
    [" £ 80 ", "£80"],
    ["£100-£220+", "£100 – £220+"],
    ["100 - 220", "£100 – £220"],
    ["£30 – £40", "£30 – £40"],
    ["-", "–"],
    ["–", "–"],
  ])("%s -> %s", (input, out) => expect(normalizePrice(input)).toBe(out));
  it.each(["", "free", "£", "£80 – ", "£-5"])("rejects %s", (input) =>
    expect(normalizePrice(input)).toBeNull(),
  );
});

describe("formatUkPhone", () => {
  it("formats UK mobiles for display", () => expect(formatUkPhone("447789096148")).toBe("07789 096148"));
  it("falls back to +digits", () => expect(formatUkPhone("33612345678")).toBe("+33612345678"));
});
