import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { buildSiteView } from "@/lib/content/view";
import {
  CATEGORY_ORDER,
  adjacentCategory,
  cardAriaLabel,
  categoryStats,
  cutLabel,
  isPickable,
  isPrice,
  minPriceForColumn,
  priceLabel,
  type CategoryKey,
  type MenuItem,
} from "@/lib/data/services";

const MENU = buildSiteView(DEFAULT_CONTENT, "").menu;

function item(category: CategoryKey, name: string): MenuItem {
  const found = MENU[category].items.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No menu item named ${name}`);
  return found;
}

describe("menu data", () => {
  it("has the expected number of services per category", () => {
    expect(CATEGORY_ORDER).toEqual(["cut", "colour", "perm", "treat"]);
    expect(CATEGORY_ORDER.map((key) => MENU[key].items.length)).toEqual([3, 6, 3, 2]);
    expect(CATEGORY_ORDER.reduce((sum, key) => sum + MENU[key].items.length, 0)).toBe(14);
  });

  it("derives the lowest 'from' price per category", () => {
    expect(CATEGORY_ORDER.map((key) => categoryStats(MENU[key]))).toEqual([
      { count: 3, from: 30 },
      { count: 6, from: 70 },
      { count: 3, from: 90 },
      { count: 2, from: 15 },
    ]);
  });
});

describe("isPrice", () => {
  it("rejects empty cells", () => {
    expect(isPrice("£80")).toBe(true);
    expect(isPrice("–")).toBe(false);
    expect(isPrice("-")).toBe(false);
    expect(isPrice("")).toBe(false);
    expect(isPrice(undefined)).toBe(false);
  });
});

describe("isPickable", () => {
  it("is pickable when prices depend on the barber", () => {
    expect(isPickable(item("cut", "Cutting & Finishing"))).toBe(true);
    expect(isPickable(item("cut", "Cleansing & Styling"))).toBe(true);
    expect(isPickable(item("cut", "Up-do Hairdressing"))).toBe(true);
  });

  it("needs at least two options with real prices otherwise", () => {
    expect(isPickable(item("colour", "Full Head Colour"))).toBe(true);
    expect(isPickable(item("colour", "Root Retouching"))).toBe(false);
    expect(isPickable(item("perm", "Half-Head Perm on Top"))).toBe(false);
    expect(isPickable(item("treat", "Olaplex No.1 & No.2"))).toBe(false);
    for (const treatment of MENU.treat.items) expect(isPickable(treatment)).toBe(false);
  });
});

describe("cutLabel", () => {
  it("appends 'length' for Short, Medium and Long", () => {
    const cols = ["Short", "Medium", "Long"];
    expect(cutLabel(cols, 0)).toBe("Short length");
    expect(cutLabel(cols, 2)).toBe("Long length");
  });

  it("leaves other columns as they are", () => {
    expect(cutLabel(["Gentleman", "Ladies", "Under 12s"], 1)).toBe("Ladies");
    expect(cutLabel(["Short"], 0)).toBe("Short");
  });
});

describe("priceLabel", () => {
  it("shows a range on its own", () => {
    expect(priceLabel(item("colour", "Technical Highlight"))).toEqual({ text: "£100 – £220+" });
    expect(priceLabel(item("treat", "Olaplex No.1 & No.2"))).toEqual({ text: "£30" });
  });

  it("shows a collapsed per-barber price as written", () => {
    expect(priceLabel(item("cut", "Cleansing & Styling"))).toEqual({ text: "£30 – £40" });
  });

  it("prefixes 'From' when there are several distinct prices", () => {
    expect(priceLabel(item("colour", "Full Head Colour"))).toEqual({
      prefix: "From",
      text: "£80",
    });
    expect(priceLabel(item("cut", "Cutting & Finishing"))).toEqual({
      prefix: "From",
      text: "£30",
    });
  });

  it("shows just the price for a single column", () => {
    expect(priceLabel(item("perm", "Half-Head Perm on Top"))).toEqual({ text: "£90" });
  });
});

describe("cardAriaLabel", () => {
  it("uses the range for single-price items and 'from' otherwise", () => {
    expect(cardAriaLabel(item("treat", "Olaplex No.1 & No.2"))).toBe(
      "Olaplex No.1 & No.2, £30. Open details",
    );
    expect(cardAriaLabel(item("colour", "Technical Highlight"))).toBe(
      "Technical Highlight, from £100. Open details",
    );
    expect(cardAriaLabel(item("perm", "Ion Straightening"))).toBe(
      "Ion Straightening, from £120. Open details",
    );
  });
});

describe("minPriceForColumn", () => {
  it("is the lowest price in the column across the barbers", () => {
    const cutting = item("cut", "Cutting & Finishing");
    expect([0, 1, 2].map((col) => minPriceForColumn(cutting, col))).toEqual([40, 60, 30]);
  });

  it("uses the single row of items without a barber axis", () =>
    expect(minPriceForColumn(item("colour", "Full Head Colour"), 0)).toBe(80));

  it("is null when no row has a price in the column", () => {
    expect(minPriceForColumn(item("colour", "Root Retouching"), 1)).toBeNull();
    expect(minPriceForColumn(item("cut", "Cutting & Finishing"), 5)).toBeNull();
  });

  function rangeItem(cells: string[]): MenuItem {
    return {
      ...item("cut", "Cutting & Finishing"),
      rows: cells.map((price, i) => ({
        label: `B${i}`,
        sub: "",
        prices: [price],
        barberId: `b${i}`,
      })),
    };
  }

  it("uses the first amount of range prices", () =>
    expect(minPriceForColumn(rangeItem(["£50 – £80", "£45 – £90", "£60 – £70"]), 0)).toBe(45));

  it("compares range and plain prices by their first amount", () =>
    expect(minPriceForColumn(rangeItem(["£100 – £220+", "£55", "£60 – £65"]), 0)).toBe(55));

  it("ignores cells that are not offered", () =>
    expect(minPriceForColumn(rangeItem(["–", "£70 – £90", "-"]), 0)).toBe(70));
});

describe("adjacentCategory", () => {
  it("steps through the categories and wraps around", () => {
    expect(adjacentCategory("cut", 1)).toBe("colour");
    expect(adjacentCategory("treat", 1)).toBe("cut");
    expect(adjacentCategory("cut", -1)).toBe("treat");
    expect(adjacentCategory("perm", -1)).toBe("colour");
  });
});
