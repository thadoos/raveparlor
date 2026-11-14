import { CATEGORY_KEYS, IMAGE_SLOTS } from "@/lib/content/schema";
import type { CategoryKey, ImageSlot, SiteContent } from "@/lib/content/schema";
import { MENU_STRUCTURE } from "@/lib/content/structure";

/** What an editor edits. Form mode and visual mode both address editors through these. */
export type EditTarget =
  | { kind: "barbers" }
  | { kind: "barber"; id: string }
  | { kind: "item"; category: CategoryKey; item: string }
  | { kind: "intro"; category: CategoryKey }
  | { kind: "hours" }
  | { kind: "business" }
  | { kind: "chemicalNote" }
  | { kind: "image"; slot: ImageSlot };

function isCategory(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}

function isSlot(value: string): value is ImageSlot {
  return (IMAGE_SLOTS as readonly string[]).includes(value);
}

/** A stable string for a target, e.g. "item:colour.roots", "image:heroLeft" or "barber:<id>". */
export function targetKey(t: EditTarget): string {
  switch (t.kind) {
    case "barbers":
    case "hours":
    case "business":
    case "chemicalNote":
      return t.kind;
    case "barber":
      return `barber:${t.id}`;
    case "item":
      return `item:${t.category}.${t.item}`;
    case "intro":
      return `intro:${t.category}`;
    case "image":
      return `image:${t.slot}`;
  }
}

/** The inverse of targetKey. Unknown kinds, categories, items and slots give null. */
export function parseTargetKey(key: string): EditTarget | null {
  const colon = key.indexOf(":");
  const kind = colon === -1 ? key : key.slice(0, colon);
  const rest = colon === -1 ? null : key.slice(colon + 1);

  switch (kind) {
    case "barbers":
    case "hours":
    case "business":
    case "chemicalNote":
      return rest === null ? { kind } : null;
    case "barber":
      return rest ? { kind, id: rest } : null;
    case "intro":
      return rest !== null && isCategory(rest) ? { kind, category: rest } : null;
    case "image":
      return rest !== null && isSlot(rest) ? { kind, slot: rest } : null;
    case "item": {
      if (rest === null) return null;
      const dot = rest.indexOf(".");
      if (dot === -1) return null;
      const category = rest.slice(0, dot);
      const item = rest.slice(dot + 1);
      if (!isCategory(category)) return null;
      if (!MENU_STRUCTURE[category].items.some((i) => i.key === item)) return null;
      return { kind, category, item };
    }
    default:
      return null;
  }
}

/** Image slots grouped as the form shows them, with a human label per slot. */
export const IMAGE_GROUPS: readonly { title: string; slots: readonly ImageSlot[] }[] = [
  { title: "Slides", slots: ["heroLeft", "heroRight", "split", "parlor"] },
  {
    title: "Services overview",
    slots: ["overview.cut", "overview.colour", "overview.perm", "overview.treat"],
  },
  { title: "Service photos", slots: ["media.cut", "media.colour", "media.perm", "media.treat"] },
  {
    title: "Service dialog photos",
    slots: [
      "dialog.cut.0",
      "dialog.cut.1",
      "dialog.colour.0",
      "dialog.colour.1",
      "dialog.perm.0",
      "dialog.perm.1",
      "dialog.treat.0",
      "dialog.treat.1",
    ],
  },
  { title: "Price poster", slots: ["priceList"] },
];

const FIXED_SLOT_LABELS: Partial<Record<ImageSlot, string>> = {
  heroLeft: "Opening slide, left",
  heroRight: "Opening slide, right",
  split: "Split slide",
  parlor: "Parlor slide",
  priceList: "Price poster",
};

export function imageSlotLabel(slot: ImageSlot): string {
  const fixed = FIXED_SLOT_LABELS[slot];
  if (fixed) return fixed;
  const [group, category, index] = slot.split(".");
  const name = isCategory(category) ? MENU_STRUCTURE[category].name : category;
  if (group === "overview") return `${name} overview`;
  if (group === "media") return `${name} photo`;
  return `${name} dialog photo ${Number(index) + 1}`;
}

/** A human title for the editor header. */
export function targetLabel(t: EditTarget, content: SiteContent): string {
  switch (t.kind) {
    case "barbers":
      return "Barbers";
    case "barber":
      return content.barbers.find((b) => b.id === t.id)?.name ?? "Barber";
    case "item":
      return MENU_STRUCTURE[t.category].items.find((i) => i.key === t.item)?.name ?? "Service";
    case "intro":
      return `${MENU_STRUCTURE[t.category].name} intro`;
    case "hours":
      return "Opening hours";
    case "business":
      return "Business";
    case "chemicalNote":
      return "Chemical services note";
    case "image":
      return imageSlotLabel(t.slot);
  }
}
