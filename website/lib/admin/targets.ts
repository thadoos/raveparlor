import { CATEGORY_KEYS, IMAGE_SLOTS } from "@/lib/content/schema";
import type { CategoryKey, ImageSlot, SiteContent } from "@/lib/content/schema";
import { MENU_STRUCTURE } from "@/lib/content/structure";
import type { EditTarget } from "@/lib/admin/target-key";

export { targetKey } from "@/lib/admin/target-key";
export type { EditTarget } from "@/lib/admin/target-key";

function isCategory(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}

function isSlot(value: string): value is ImageSlot {
  return (IMAGE_SLOTS as readonly string[]).includes(value);
}

/** Whether `item` is one of the category's services (as MENU_STRUCTURE lists them). */
function isItem(category: string, item: string): category is CategoryKey {
  return isCategory(category) && MENU_STRUCTURE[category].items.some((i) => i.key === item);
}

/** The inverse of targetKey. Unknown kinds, categories, items, slots and photo indices give null. */
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
      const hash = rest?.indexOf("#") ?? -1;
      const parts = (hash === -1 ? rest : rest?.slice(0, hash))?.split(".");
      if (parts?.length !== 2 || !isItem(parts[0], parts[1])) return null;
      if (hash === -1) return { kind, category: parts[0], item: parts[1] };
      return rest?.slice(hash + 1) === "pricing"
        ? { kind, category: parts[0], item: parts[1], focus: "pricing" }
        : null;
    }
    case "itemPhoto": {
      const parts = rest?.split(".");
      if (parts?.length !== 3 || !isItem(parts[0], parts[1])) return null;
      const index = parts[2] === "0" ? 0 : parts[2] === "1" ? 1 : null;
      if (index === null) return null;
      return { kind, category: parts[0], item: parts[1], index };
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
  const [group, category] = slot.split(".");
  const name = isCategory(category) ? MENU_STRUCTURE[category].name : category;
  return group === "overview" ? `${name} overview` : `${name} photo`;
}

function itemName(category: CategoryKey, item: string): string {
  return MENU_STRUCTURE[category].items.find((i) => i.key === item)?.name ?? "Service";
}

/** A human title for the editor header. */
export function targetLabel(t: EditTarget, content: SiteContent): string {
  switch (t.kind) {
    case "barbers":
      return "Barbers";
    case "barber":
      return content.barbers.find((b) => b.id === t.id)?.name ?? "Barber";
    case "item":
      return itemName(t.category, t.item);
    case "itemPhoto":
      return `${itemName(t.category, t.item)} photo ${t.index + 1}`;
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
