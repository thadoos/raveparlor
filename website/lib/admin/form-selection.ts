import { deepEqual } from "@/lib/admin/changes";
import type { EditTarget } from "@/lib/admin/target-key";
import { CATEGORY_KEYS, IMAGE_SLOTS } from "@/lib/content/schema";
import type { CategoryKey, ImageSlot, SiteContent } from "@/lib/content/schema";
import { MENU_STRUCTURE } from "@/lib/content/structure";

/** What form mode shows: one section at a time and, in Services, one service or category intro. */

export type FormSection = "barbers" | "services" | "hours" | "photos" | "business";

/** A service ("cut.cutting") or a category intro ("cut.intro") in the Services list. */
export type FormItem = `${CategoryKey}.${string}`;

export interface FormSelection {
  section: FormSection;
  item?: FormItem;
  /** In Photos: the image to scroll to, e.g. the price poster a publish warning links to. */
  slot?: ImageSlot;
}

export const FORM_SECTIONS: readonly { id: FormSection; label: string }[] = [
  { id: "barbers", label: "Barbers" },
  { id: "services", label: "Services" },
  { id: "hours", label: "Opening hours" },
  { id: "photos", label: "Photos" },
  { id: "business", label: "Business" },
];

const DEFAULT_SECTION: FormSection = "services";
const INTRO = "intro";

/** The Services list in display order: per category, its intro, then its services. */
export const SERVICE_LIST: readonly {
  category: CategoryKey;
  name: string;
  entries: readonly { item: FormItem; label: string }[];
}[] = CATEGORY_KEYS.map((category) => {
  const structure = MENU_STRUCTURE[category];
  return {
    category,
    name: structure.name,
    entries: [
      { item: introItem(category), label: `${structure.name} - intro` },
      ...structure.items.map((i) => ({ item: serviceItem(category, i.key), label: i.name })),
    ],
  };
});

function introItem(category: CategoryKey): FormItem {
  return `${category}.${INTRO}`;
}

function serviceItem(category: CategoryKey, key: string): FormItem {
  return `${category}.${key}`;
}

function isSection(value: string | null): value is FormSection {
  return FORM_SECTIONS.some((s) => s.id === value);
}

function isSlot(value: string | null): value is ImageSlot {
  return (IMAGE_SLOTS as readonly (string | null)[]).includes(value);
}

function isCategory(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}

/** Splits a list entry into its category and service key (`null` for the intro). */
function splitItem(item: string): { category: CategoryKey; key: string | null } | null {
  const parts = item.split(".");
  if (parts.length !== 2 || !isCategory(parts[0])) return null;
  const [category, key] = parts;
  if (key === INTRO) return { category, key: null };
  return MENU_STRUCTURE[category].items.some((i) => i.key === key) ? { category, key } : null;
}

/**
 * Reads `?section=&item=` (or `?section=photos&slot=`). Unknown values fall back to Services with
 * nothing selected; an unknown slot is dropped.
 */
export function parseFormSelection(params: URLSearchParams): FormSelection {
  const raw = params.get("section");
  const section = isSection(raw) ? raw : DEFAULT_SECTION;
  if (section === "photos") {
    const slot = params.get("slot");
    return isSlot(slot) ? { section, slot } : { section };
  }
  const item = params.get("item");
  if (section !== "services" || item === null || !splitItem(item)) return { section };
  return { section, item: item as FormItem };
}

/** The query string for a selection, without the leading "?". */
export function formSelectionQuery(s: FormSelection): string {
  const params = new URLSearchParams({ section: s.section });
  if (s.section === "services" && s.item) params.set("item", s.item);
  if (s.section === "photos" && s.slot) params.set("slot", s.slot);
  return params.toString();
}

/** The editor a selection shows: null while Services has nothing selected. Photos shows a group of
 *  image editors, so it has no single target either. */
export function selectionTarget(s: FormSelection): EditTarget | null {
  switch (s.section) {
    case "barbers":
    case "hours":
    case "business":
      return { kind: s.section };
    case "photos":
      return null;
    case "services": {
      const parts = s.item ? splitItem(s.item) : null;
      if (!parts) return null;
      return parts.key === null
        ? { kind: "intro", category: parts.category }
        : { kind: "item", category: parts.category, item: parts.key };
    }
  }
}

/** The first service that shows the shared chemical note, where that note is edited. */
function chemicalNoteItem(): FormItem | undefined {
  for (const category of CATEGORY_KEYS) {
    const item = MENU_STRUCTURE[category].items.find((i) => i.chemicalNote);
    if (item) return serviceItem(category, item.key);
  }
  return undefined;
}

/** Where form mode edits a target (used by links such as publish warnings). */
export function targetSelection(t: EditTarget): FormSelection {
  switch (t.kind) {
    case "barbers":
    case "barber":
      return { section: "barbers" };
    case "item":
    case "itemPhoto":
      return { section: "services", item: serviceItem(t.category, t.item) };
    case "intro":
      return { section: "services", item: introItem(t.category) };
    case "chemicalNote": {
      const item = chemicalNoteItem();
      return item ? { section: "services", item } : { section: "services" };
    }
    case "hours":
      return { section: "hours" };
    case "business":
      return { section: "business" };
    case "image":
      return { section: "photos", slot: t.slot };
  }
}

/** Sections and Services entries whose content differs between `saved` and `draft`. */
export function dirtySections(saved: SiteContent, draft: SiteContent): Set<FormSection | FormItem> {
  const dirty = new Set<FormSection | FormItem>();
  if (!deepEqual(saved.barbers, draft.barbers)) dirty.add("barbers");
  if (!deepEqual(saved.business.hours, draft.business.hours)) dirty.add("hours");
  if (saved.business.defaultWhatsApp !== draft.business.defaultWhatsApp) dirty.add("business");
  if (!deepEqual(saved.images, draft.images)) dirty.add("photos");

  const chemicalChanged = saved.sharedNotes.chemical !== draft.sharedNotes.chemical;
  for (const category of CATEGORY_KEYS) {
    const before = saved.services[category];
    const after = draft.services[category];
    if (!deepEqual(before.intro, after.intro)) dirty.add(introItem(category));
    for (const { key, chemicalNote } of MENU_STRUCTURE[category].items) {
      const itemBefore = Object.hasOwn(before.items, key) ? before.items[key] : undefined;
      const itemAfter = Object.hasOwn(after.items, key) ? after.items[key] : undefined;
      if ((chemicalNote && chemicalChanged) || !deepEqual(itemBefore, itemAfter)) {
        dirty.add(serviceItem(category, key));
      }
    }
  }
  if (chemicalChanged || [...dirty].some((key) => key.includes("."))) dirty.add("services");
  return dirty;
}

/**
 * How a selection change is written to browser history. Moving to another section or opening an
 * entry from the Services list pushes, so the back button returns; changes within one level (one
 * service to another) replace. `fromList` marks an entry whose previous entry is the Services list,
 * so the phone back link can go back instead of stacking another entry.
 */
export function historyUpdate(
  prev: FormSelection,
  next: FormSelection,
  prevFromList: boolean,
): { mode: "push" | "replace" | "none"; fromList: boolean } {
  if (formSelectionQuery(prev) === formSelectionQuery(next)) {
    return { mode: "none", fromList: prevFromList };
  }
  const nextHasItem = next.section === "services" && next.item !== undefined;
  if (prev.section !== next.section) return { mode: "push", fromList: false };
  if (prev.item === undefined && nextHasItem) return { mode: "push", fromList: true };
  return { mode: "replace", fromList: prevFromList && nextHasItem };
}
