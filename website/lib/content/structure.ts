import { CUT_COLUMNS } from "@/lib/content/schema";
import type { CategoryKey, ImageSlot } from "@/lib/content/schema";

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
