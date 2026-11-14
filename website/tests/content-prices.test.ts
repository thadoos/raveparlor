import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { allCells, priceRows, rowsIdentical } from "@/lib/content/prices";

const { barbers, services } = DEFAULT_CONTENT;
const cutting = services.cut.items.cutting;
const cleansing = services.cut.items.cleansing;
const roots = services.colour.items.roots;

describe("priceRows", () => {
  it("gives one row per barber, in barber order, for per-barber prices", () => {
    const rows = priceRows(cutting, barbers);
    expect(rows.map((r) => r.barberId)).toEqual(barbers.map((b) => b.id));
    expect(rows[0].prices).toEqual(["£55", "£80", "£35"]);
    const reversed = [...barbers].reverse();
    expect(priceRows(cutting, reversed).map((r) => r.barberId)).toEqual(reversed.map((b) => b.id));
  });

  it("gives one row without a barber otherwise", () => {
    expect(priceRows(roots, barbers)).toEqual([{ barberId: null, prices: ["£80", "–", "–"] }]);
  });
});

describe("rowsIdentical", () => {
  it("is true when every barber charges the same", () => {
    expect(rowsIdentical(priceRows(cleansing, barbers))).toBe(true);
    expect(rowsIdentical(priceRows(roots, barbers))).toBe(true);
  });

  it("is false when the barbers' prices differ", () =>
    expect(rowsIdentical(priceRows(cutting, barbers))).toBe(false));
});

describe("allCells", () => {
  it("lists every cell", () => {
    expect(allCells(roots, barbers)).toEqual(["£80", "–", "–"]);
    expect(allCells(cutting, barbers)).toHaveLength(9);
  });
});
