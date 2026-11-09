import { describe, expect, it } from "vitest";
import {
  CATEGORY_ORDER,
  adjacentCategory,
  MENU,
  cardAriaLabel,
  categoryStats,
  cutLabel,
  hasChoices,
  isPickable,
  isPrice,
  minPriceForColumn,
  priceLabel,
  totalServices,
  type CategoryKey,
  type MenuItem,
} from "@/lib/data/services";

function item(category: CategoryKey, name: string): MenuItem {
  const found = MENU[category].items.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No menu item named ${name}`);
  return found;
}

describe("menu data", () => {
  it("has the expected number of services per category", () => {
    expect(CATEGORY_ORDER).toEqual(["cut", "colour", "perm", "treat"]);
    expect(CATEGORY_ORDER.map((key) => MENU[key].items.length)).toEqual([3, 6, 3, 2]);
    expect(totalServices).toBe(14);
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

describe("hasChoices and isPickable", () => {
  it("needs at least two real prices to have choices", () => {
    expect(hasChoices(item("colour", "Root Retouching"))).toBe(false);
    expect(hasChoices(item("colour", "Full Head Colour"))).toBe(true);
    expect(hasChoices(item("perm", "Half-Head Perm on Top"))).toBe(false);
  });

  it("has no choices for per-barber rows or single prices", () => {
    expect(hasChoices(item("cut", "Cutting & Finishing"))).toBe(false);
    expect(hasChoices(item("cut", "Cleansing & Styling"))).toBe(false);
  });

  it("is pickable when the category has barbers or the item has choices", () => {
    expect(isPickable(item("colour", "Root Retouching"), MENU.colour)).toBe(false);
    expect(isPickable(item("colour", "Full Head Colour"), MENU.colour)).toBe(true);
    expect(isPickable(item("perm", "Half-Head Perm on Top"), MENU.perm)).toBe(false);
    expect(isPickable(item("cut", "Cutting & Finishing"), MENU.cut)).toBe(true);
    expect(isPickable(item("cut", "Cleansing & Styling"), MENU.cut)).toBe(true);
    for (const treatment of MENU.treat.items) {
      expect(isPickable(treatment, MENU.treat)).toBe(false);
    }
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

  it("prefixes 'From' when there are several columns", () => {
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

  it("is null without per-barber rows", () => {
    expect(minPriceForColumn(item("colour", "Full Head Colour"), 0)).toBeNull();
    expect(minPriceForColumn(item("cut", "Cutting & Finishing"), 5)).toBeNull();
  });
});

describe("adjacentCategory", () => {
  it("steps through the categories and wraps around", () => {
    expect(adjacentCategory("cut", 1)).toBe("colour");
    expect(adjacentCategory("treat", 1)).toBe("cut");
    expect(adjacentCategory("cut", -1)).toBe("treat");
    expect(adjacentCategory("perm", -1)).toBe("colour");
  });
});
