// Type-only imports: schema.ts imports checkStructure from here at runtime.
import type { CategoryKey, ImageSlot, ItemContent, SiteContent } from "@/lib/content/schema";

/** Fixed shape of the menu: which items exist, in what order, and their fixed flags. Options, the
 *  barber axis and prices are content (see ItemContent). */

export interface ItemStructure {
  key: string;
  name: string;
  single?: boolean;
  chemicalNote?: boolean;
}

export interface CategoryStructure {
  name: string;
  items: readonly ItemStructure[];
}

/** Hair length options used by the colour and perm price tables. */
export const LENGTHS = ["Short", "Medium", "Long"] as const;

export const MENU_STRUCTURE: Record<CategoryKey, CategoryStructure> = {
  cut: {
    name: "Cut & Style",
    items: [
      { key: "cutting", name: "Cutting & Finishing" },
      { key: "cleansing", name: "Cleansing & Styling" },
      { key: "updo", name: "Up-do Hairdressing" },
    ],
  },
  colour: {
    name: "Colour & Highlights",
    items: [
      { key: "roots", name: "Root Retouching", chemicalNote: true },
      { key: "fullColour", name: "Full Head Colour", chemicalNote: true },
      { key: "halfHighlights", name: "Half Head Highlights", chemicalNote: true },
      { key: "fullHighlights", name: "Full Head Highlights", chemicalNote: true },
      { key: "technicalHighlight", name: "Technical Highlight", chemicalNote: true },
      { key: "bleach", name: "Full Head Bleach", chemicalNote: true },
    ],
  },
  perm: {
    name: "Perm & Straightening",
    items: [
      { key: "coolPerm", name: "Technical Perm (Cool Perm)", chemicalNote: true },
      { key: "halfPerm", name: "Half-Head Perm on Top", chemicalNote: true },
      { key: "ionStraightening", name: "Ion Straightening", chemicalNote: true },
    ],
  },
  treat: {
    name: "Treatments",
    items: [
      { key: "olaplex", name: "Olaplex No.1 & No.2", single: true },
      { key: "scalpSpa", name: "Kérastase Scalp Relax Spa & Serum", single: true },
    ],
  },
};

const NOT_OFFERED = "–";

function plural(n: number): string {
  return `${n} price${n === 1 ? "" : "s"}`;
}

/** Issues with one item's options, price shape and photos. `path` is the item's path. */
function checkItem(item: ItemContent, barberIds: readonly string[], path: string): string[] {
  const issues: string[] = [];

  const labels = item.options.map((o) => o.trim().toLowerCase());
  item.options.forEach((option, i) => {
    if (labels[i] === "") issues.push(`${path}.options.${i}: Option label is required`);
    else if (labels.indexOf(labels[i]) !== i)
      issues.push(`${path}.options.${i}: Duplicate option "${option}"`);
  });

  const width = Math.max(1, item.options.length);
  const checkRow = (row: readonly string[], rowPath: string) => {
    if (row.length !== width)
      issues.push(`${rowPath}: Expected ${plural(width)}, got ${row.length}`);
  };
  const { base, barbers } = item.prices;
  const cells: string[] = [];
  if (item.byBarber) {
    if (base !== undefined)
      issues.push(`${path}.prices.base: Not allowed when prices depend on the barber`);
    if (barbers === undefined) {
      issues.push(`${path}.prices.barbers: Required when prices depend on the barber`);
    } else {
      for (const id of barberIds) {
        const row = Object.hasOwn(barbers, id) ? barbers[id] : undefined;
        if (row === undefined)
          issues.push(`${path}.prices.barbers.${id}: Missing prices for this barber`);
        else {
          checkRow(row, `${path}.prices.barbers.${id}`);
          cells.push(...row);
        }
      }
      for (const id of Object.keys(barbers)) {
        if (!barberIds.includes(id)) issues.push(`${path}.prices.barbers.${id}: Unknown barber`);
      }
    }
  } else {
    if (barbers !== undefined) {
      issues.push(`${path}.prices.barbers: Not allowed when prices don't depend on the barber`);
    }
    if (base === undefined) issues.push(`${path}.prices.base: Required`);
    else {
      checkRow(base, `${path}.prices.base`);
      cells.push(...base);
    }
  }
  if (cells.length > 0 && cells.every((cell) => cell === NOT_OFFERED)) {
    issues.push(`${path}.prices: At least one price is required`);
  }

  const photos: readonly unknown[] = item.photos;
  if (photos.length < 1 || photos.length > 2) {
    issues.push(`${path}.photos: Expected 1 or 2 photos, got ${photos.length}`);
  }
  return issues;
}

/**
 * Checks what the zod schema can't: every category has exactly the items MENU_STRUCTURE lists, and
 * each item has unique non-empty options, prices shaped to its options and barber axis (one row per
 * current barber when byBarber), at least one real price, and 1-2 photos. Returns readable issues.
 */
export function checkStructure(content: SiteContent): string[] {
  const issues: string[] = [];
  const barberIds = content.barbers.map((b) => b.id);
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
      issues.push(...checkItem(data, barberIds, `${path}.${item.key}`));
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
