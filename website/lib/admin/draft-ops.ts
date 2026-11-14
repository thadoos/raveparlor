import type {
  Barber,
  CategoryKey,
  ImageRef,
  ImageSlot,
  ItemContent,
  ItemPrices,
  OpeningHours,
  SiteContent,
} from "@/lib/content/schema";

/**
 * Pure edits on a draft. Each returns a new SiteContent and never mutates its input; untouched
 * branches are shared with the input, so React can compare them by reference. An edit that doesn't
 * fit the content (unknown barber, missing cell or photo, invalid options) returns the input itself.
 */

const NOT_OFFERED = "–";

type Photos = ItemContent["photos"];

/** Cells per price row: one per option, or a single cell for an item without options. */
function rowWidth(item: ItemContent): number {
  return Math.max(1, item.options.length);
}

/** Replaces one item via `edit`. When `edit` returns the same item, so does this: `c` itself. */
function updateItem(
  c: SiteContent,
  category: CategoryKey,
  itemKey: string,
  edit: (item: ItemContent) => ItemContent,
): SiteContent {
  const cat = c.services[category];
  if (!Object.hasOwn(cat.items, itemKey)) return c;
  const item = cat.items[itemKey];
  const next = edit(item);
  if (next === item) return c;
  return {
    ...c,
    services: { ...c.services, [category]: { ...cat, items: { ...cat.items, [itemKey]: next } } },
  };
}

/** Applies `edit` to every item, keeping the input when nothing changes. */
function updateEveryItem(c: SiteContent, edit: (item: ItemContent) => ItemContent): SiteContent {
  let next = c;
  for (const [category, cat] of Object.entries(c.services) as [
    CategoryKey,
    SiteContent["services"][CategoryKey],
  ][]) {
    for (const key of Object.keys(cat.items)) next = updateItem(next, category, key, edit);
  }
  return next;
}

/** A barber's row, or undefined when the item has none for that id. */
function barberRow(item: ItemContent, id: string): string[] | undefined {
  const rows = item.prices.barbers;
  return rows && Object.hasOwn(rows, id) ? rows[id] : undefined;
}

/** The row prices fall back to when an item has none: every cell not offered. */
function emptyRow(item: ItemContent): string[] {
  return Array.from({ length: rowWidth(item) }, () => NOT_OFFERED);
}

/** Adds the barber and gives them, in every item priced by barber, a copy of the first barber's row. */
export function addBarber(c: SiteContent, barber: Omit<Barber, "id">, id: string): SiteContent {
  const first = c.barbers.at(0);
  const withRows = updateEveryItem(c, (item) => {
    if (!item.byBarber) return item;
    const source = (first && barberRow(item, first.id)) ?? emptyRow(item);
    return { ...item, prices: { barbers: { ...item.prices.barbers, [id]: [...source] } } };
  });
  return { ...withRows, barbers: [...c.barbers, { id, ...barber }] };
}

/** Removes the barber and their row from every item. */
export function removeBarber(c: SiteContent, id: string): SiteContent {
  const withoutRows = updateEveryItem(c, (item) => {
    const rows = item.prices.barbers;
    if (!rows || !Object.hasOwn(rows, id)) return item;
    const barbers = { ...rows };
    delete barbers[id];
    return { ...item, prices: { ...item.prices, barbers } };
  });
  return { ...withoutRows, barbers: c.barbers.filter((b) => b.id !== id) };
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

/** The item's copy. Options, prices and photos have their own ops below. */
export type ItemCopyPatch = Partial<Pick<ItemContent, "desc" | "ideal" | "note">>;

export function setItemContent(
  c: SiteContent,
  category: CategoryKey,
  itemKey: string,
  patch: ItemCopyPatch,
): SiteContent {
  const { desc, ideal, note } = patch;
  const copy: ItemCopyPatch = {};
  if (desc !== undefined) copy.desc = desc;
  if (ideal !== undefined) copy.ideal = ideal;
  if (note !== undefined) copy.note = note;
  return updateItem(c, category, itemKey, (item) => ({ ...item, ...copy }));
}

/** Removes the item's own note, so a chemical item falls back to the shared note again. */
export function clearItemNote(c: SiteContent, category: CategoryKey, itemKey: string): SiteContent {
  return updateItem(c, category, itemKey, (item) => {
    const next = { ...item };
    delete next.note;
    return next;
  });
}

/** Rebuilds every price row of an item with `edit`. */
function mapRows(prices: ItemPrices, edit: (row: string[]) => string[]): ItemPrices {
  const next: ItemPrices = {};
  if (prices.base) next.base = edit(prices.base);
  if (prices.barbers) {
    next.barbers = Object.fromEntries(
      Object.entries(prices.barbers).map(([id, row]) => [id, edit(row)]),
    );
  }
  return next;
}

/**
 * Sets an item's options and remaps every price row to match: add, rename, remove and reorder in
 * one call. `mapping[i]` is the old cell index that new cell `i` keeps, or null for a new cell,
 * which starts as "–" (not offered). Cells are indexed per row, so there is one mapping entry per
 * new cell: `max(1, options.length)` entries, and an item without options has one cell, index 0.
 * Labels are trimmed. Validated here rather than by the editor, so the draft always keeps the
 * option rules checkStructure enforces: blank labels, labels equal ignoring case and surrounding
 * space, a mapping of the wrong length, or old indices that are out of range or repeated all
 * return `c` unchanged.
 */
export function setOptions(
  c: SiteContent,
  category: CategoryKey,
  itemKey: string,
  options: string[],
  mapping: (number | null)[],
): SiteContent {
  return updateItem(c, category, itemKey, (item) => {
    const labels = options.map((option) => option.trim());
    const folded = labels.map((label) => label.toLowerCase());
    if (folded.some((label, i) => label === "" || folded.indexOf(label) !== i)) return item;

    const oldWidth = rowWidth(item);
    if (mapping.length !== Math.max(1, labels.length)) return item;
    const sources = mapping.filter((index) => index !== null);
    const inRange = sources.every(
      (index) => Number.isInteger(index) && index >= 0 && index < oldWidth,
    );
    if (!inRange || new Set(sources).size !== sources.length) return item;

    const remap = (row: string[]) =>
      mapping.map((index) => (index === null ? NOT_OFFERED : (row[index] ?? NOT_OFFERED)));
    return { ...item, options: labels, prices: mapRows(item.prices, remap) };
  });
}

/**
 * Switches whether the item's prices depend on the barber. On: every barber starts with a copy of
 * the base row. Off: the first barber's row becomes the base row. Keeps `c` when already set.
 */
export function setByBarber(
  c: SiteContent,
  category: CategoryKey,
  itemKey: string,
  on: boolean,
): SiteContent {
  return updateItem(c, category, itemKey, (item) => {
    if (item.byBarber === on) return item;
    if (on) {
      const base = item.prices.base ?? emptyRow(item);
      const barbers = Object.fromEntries(c.barbers.map((b) => [b.id, [...base]]));
      return { ...item, byBarber: true, prices: { barbers } };
    }
    const first = c.barbers.at(0);
    const base = (first && barberRow(item, first.id)) ?? emptyRow(item);
    return { ...item, byBarber: false, prices: { base: [...base] } };
  });
}

/**
 * Sets one price cell: the barber's row, or the base row when `barberId` is null. A row that
 * doesn't fit the item's barber axis, or a cell index outside the row, keeps `c`.
 */
export function setPrice(
  c: SiteContent,
  category: CategoryKey,
  itemKey: string,
  barberId: string | null,
  index: number,
  value: string,
): SiteContent {
  return updateItem(c, category, itemKey, (item) => {
    if (item.byBarber !== (barberId !== null)) return item;
    const row = barberId === null ? item.prices.base : barberRow(item, barberId);
    if (!row || !Number.isInteger(index) || index < 0 || index >= row.length) return item;
    const next = row.map((cell, i) => (i === index ? value : cell));
    return {
      ...item,
      prices:
        barberId === null
          ? { ...item.prices, base: next }
          : { ...item.prices, barbers: { ...item.prices.barbers, [barberId]: next } },
    };
  });
}

/** Copies one barber's row to every barber. Unknown barbers and items without the axis keep `c`. */
export function applyRowToAllBarbers(
  c: SiteContent,
  category: CategoryKey,
  itemKey: string,
  barberId: string,
): SiteContent {
  return updateItem(c, category, itemKey, (item) => {
    const source = item.byBarber ? barberRow(item, barberId) : undefined;
    if (!source) return item;
    const barbers = Object.fromEntries(c.barbers.map((b) => [b.id, [...source]]));
    return { ...item, prices: { barbers } };
  });
}

/** Replaces the photo at `index` via `edit`. A missing photo keeps `c`. */
function updatePhoto(
  c: SiteContent,
  category: CategoryKey,
  itemKey: string,
  index: number,
  edit: (photo: ImageRef) => ImageRef,
): SiteContent {
  return updateItem(c, category, itemKey, (item) => {
    if (index < 0 || index >= item.photos.length) return item;
    const at = (i: number, photo: ImageRef) => (i === index ? edit(photo) : photo);
    const photos: Photos =
      item.photos.length === 2
        ? [at(0, item.photos[0]), at(1, item.photos[1])]
        : [at(0, item.photos[0])];
    return { ...item, photos };
  });
}

export function setItemPhoto(
  c: SiteContent,
  category: CategoryKey,
  itemKey: string,
  index: 0 | 1,
  ref: ImageRef,
): SiteContent {
  return updatePhoto(c, category, itemKey, index, () => ref);
}

export function setItemPhotoAlt(
  c: SiteContent,
  category: CategoryKey,
  itemKey: string,
  index: 0 | 1,
  alt: string,
): SiteContent {
  return updatePhoto(c, category, itemKey, index, (photo) => ({ ...photo, alt }));
}

/** Adds a second photo. An item that already has two keeps `c`. */
export function addItemPhoto(
  c: SiteContent,
  category: CategoryKey,
  itemKey: string,
  ref: ImageRef,
): SiteContent {
  return updateItem(c, category, itemKey, (item) =>
    item.photos.length === 1 ? { ...item, photos: [item.photos[0], ref] } : item,
  );
}

/** Removes a photo. Removing the only one (an item needs at least one) keeps `c`. */
export function removeItemPhoto(
  c: SiteContent,
  category: CategoryKey,
  itemKey: string,
  index: 0 | 1,
): SiteContent {
  return updateItem(c, category, itemKey, (item) => {
    if (item.photos.length !== 2) return item;
    return { ...item, photos: [item.photos[index === 0 ? 1 : 0]] };
  });
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
