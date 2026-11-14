// Type-only imports: schema.ts imports checkStructure from here at runtime.
import type { CategoryKey, ImageSlot, SiteContent } from "@/lib/content/schema";

/** Fixed shape of the menu: which items exist, in what order, and how their prices are laid out. */

export interface ItemStructure {
  key: string;
  name: string;
  kind: "barberTable" | "table" | "range";
  cols?: readonly string[];
  single?: boolean;
  chemicalNote?: boolean;
}

export interface CategoryStructure {
  name: string;
  barbers: boolean;
  items: readonly ItemStructure[];
}

export const CUT_COLUMNS = ["Gentleman", "Ladies", "Under 12s"] as const;

const LENGTHS = ["Short", "Medium", "Long"] as const;

export const MENU_STRUCTURE: Record<CategoryKey, CategoryStructure> = {
  cut: {
    name: "Cut & Style",
    barbers: true,
    items: [
      { key: "cutting", name: "Cutting & Finishing", kind: "barberTable", cols: CUT_COLUMNS },
      { key: "cleansing", name: "Cleansing & Styling", kind: "range" },
      { key: "updo", name: "Up-do Hairdressing", kind: "range" },
    ],
  },
  colour: {
    name: "Colour & Highlights",
    barbers: false,
    items: [
      { key: "roots", name: "Root Retouching", kind: "table", cols: LENGTHS, chemicalNote: true },
      { key: "fullColour", name: "Full Head Colour", kind: "table", cols: LENGTHS, chemicalNote: true },
      { key: "halfHighlights", name: "Half Head Highlights", kind: "table", cols: LENGTHS, chemicalNote: true },
      { key: "fullHighlights", name: "Full Head Highlights", kind: "table", cols: LENGTHS, chemicalNote: true },
      { key: "technicalHighlight", name: "Technical Highlight", kind: "range", chemicalNote: true },
      { key: "bleach", name: "Full Head Bleach", kind: "range", chemicalNote: true },
    ],
  },
  perm: {
    name: "Perm & Straightening",
    barbers: false,
    items: [
      { key: "coolPerm", name: "Technical Perm (Cool Perm)", kind: "table", cols: LENGTHS, chemicalNote: true },
      { key: "halfPerm", name: "Half-Head Perm on Top", kind: "table", cols: ["Short"], chemicalNote: true },
      { key: "ionStraightening", name: "Ion Straightening", kind: "table", cols: LENGTHS, chemicalNote: true },
    ],
  },
  treat: {
    name: "Treatments",
    barbers: false,
    items: [
      { key: "olaplex", name: "Olaplex No.1 & No.2", kind: "range", single: true },
      { key: "scalpSpa", name: "Kérastase Scalp Relax Spa & Serum", kind: "range", single: true },
    ],
  },
};

/**
 * Checks what the zod schema can't: every category has exactly the items MENU_STRUCTURE lists,
 * table items have one price per column, and range items have a range. Returns readable issues.
 */
export function checkStructure(content: SiteContent): string[] {
  const issues: string[] = [];
  for (const [category, structure] of Object.entries(MENU_STRUCTURE) as [
    CategoryKey,
    CategoryStructure,
  ][]) {
    const items = content.services[category].items;
    const path = `services.${category}.items`;
    const known = new Set(structure.items.map((item) => item.key));
    for (const key of Object.keys(items)) {
      if (!known.has(key)) issues.push(`${path}.${key}: Unknown item`);
    }
    for (const item of structure.items) {
      const data = Object.hasOwn(items, item.key) ? items[item.key] : undefined;
      if (!data) {
        issues.push(`${path}.${item.key}: Missing item`);
        continue;
      }
      if (item.kind === "table") {
        const expected = item.cols?.length ?? 0;
        const actual = data.prices?.length ?? 0;
        if (actual !== expected) {
          issues.push(
            `${path}.${item.key}.prices: Expected ${expected} price${expected === 1 ? "" : "s"}, got ${actual}`,
          );
        }
      } else if (item.kind === "range" && data.range === undefined) {
        issues.push(`${path}.${item.key}.range: Required`);
      }
    }
  }
  return issues;
}

/** CSS `object-position` per image slot (slots not listed use the default centre). */
export const IMAGE_POSITIONS: Partial<Record<ImageSlot, string>> = {
  heroLeft: "46% 42%",
  heroRight: "50% 38%",
  split: "50% 40%",
  parlor: "50% 50%",
  "overview.cut": "50% 30%",
  "overview.colour": "50% 50%",
  "overview.perm": "50% 40%",
  "overview.treat": "40% 50%",
  "media.cut": "50% 30%",
  "media.colour": "50% 30%",
  "media.perm": "50% 30%",
  "media.treat": "40% 50%",
};
