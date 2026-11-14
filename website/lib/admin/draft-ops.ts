import type {
  Barber,
  CategoryKey,
  ImageRef,
  ImageSlot,
  ItemContent,
  OpeningHours,
  SiteContent,
} from "@/lib/content/schema";

/**
 * Pure edits on a draft. Each returns a new SiteContent and never mutates its input; untouched
 * branches are shared with the input, so React can compare them by reference.
 */

export function addBarber(c: SiteContent, barber: Omit<Barber, "id">, id: string): SiteContent {
  return { ...c, barbers: [...c.barbers, { id, ...barber }] };
}

export function removeBarber(c: SiteContent, id: string): SiteContent {
  return { ...c, barbers: c.barbers.filter((b) => b.id !== id) };
}

/** Moves the barber to `toIndex`, clamped to the list. Unknown ids leave the order alone. */
export function moveBarber(c: SiteContent, id: string, toIndex: number): SiteContent {
  const from = c.barbers.findIndex((b) => b.id === id);
  if (from === -1) return c;
  const barbers = c.barbers.filter((b) => b.id !== id);
  const to = Math.max(0, Math.min(toIndex, barbers.length));
  barbers.splice(to, 0, c.barbers[from]);
  return { ...c, barbers };
}

export function updateBarber(
  c: SiteContent,
  id: string,
  patch: Partial<Omit<Barber, "id">>,
): SiteContent {
  return { ...c, barbers: c.barbers.map((b) => (b.id === id ? { ...b, ...patch, id: b.id } : b)) };
}

export function setItemContent(
  c: SiteContent,
  category: CategoryKey,
  itemKey: string,
  patch: Partial<ItemContent>,
): SiteContent {
  const cat = c.services[category];
  const item = cat.items[itemKey];
  return {
    ...c,
    services: {
      ...c.services,
      [category]: { ...cat, items: { ...cat.items, [itemKey]: { ...item, ...patch } } },
    },
  };
}

/** Removes the item's own note, so a chemical item falls back to the shared note again. */
export function clearItemNote(c: SiteContent, category: CategoryKey, itemKey: string): SiteContent {
  const cat = c.services[category];
  const item = { ...cat.items[itemKey] };
  delete item.note;
  return {
    ...c,
    services: { ...c.services, [category]: { ...cat, items: { ...cat.items, [itemKey]: item } } },
  };
}

export function setIntro(
  c: SiteContent,
  category: CategoryKey,
  index: 0 | 1,
  text: string,
): SiteContent {
  const cat = c.services[category];
  const intro: [string, string] = index === 0 ? [text, cat.intro[1]] : [cat.intro[0], text];
  return { ...c, services: { ...c.services, [category]: { ...cat, intro } } };
}

export function setHours(c: SiteContent, hours: OpeningHours[]): SiteContent {
  return { ...c, business: { ...c.business, hours } };
}

export function setDefaultWhatsApp(c: SiteContent, digits: string): SiteContent {
  return { ...c, business: { ...c.business, defaultWhatsApp: digits } };
}

export function setChemicalNote(c: SiteContent, text: string): SiteContent {
  return { ...c, sharedNotes: { ...c.sharedNotes, chemical: text } };
}

export function setImage(c: SiteContent, slot: ImageSlot, ref: ImageRef): SiteContent {
  return { ...c, images: { ...c.images, [slot]: ref } };
}

export function setImageAlt(c: SiteContent, slot: ImageSlot, alt: string): SiteContent {
  return { ...c, images: { ...c.images, [slot]: { ...c.images[slot], alt } } };
}
