import { CATEGORY_KEYS, IMAGE_SLOTS } from "@/lib/content/schema";
import type {
  Barber,
  CategoryKey,
  ImageRef,
  ItemContent,
  Review,
  SiteContent,
} from "@/lib/content/schema";
import { MENU_STRUCTURE } from "@/lib/content/structure";

/** Structural equality for JSON-like values. Ignores object key order (jsonb reorders keys). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, i) => deepEqual(value, b[i]));
  }
  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const keys = Object.keys(aRecord);
  if (keys.length !== Object.keys(bRecord).length) return false;
  return keys.every((key) => Object.hasOwn(bRecord, key) && deepEqual(aRecord[key], bRecord[key]));
}

function itemOf(c: SiteContent, category: CategoryKey, key: string): ItemContent | undefined {
  const items = c.services[category].items;
  return Object.hasOwn(items, key) ? items[key] : undefined;
}

function byId(barbers: readonly Barber[]): Map<string, Barber> {
  return new Map(barbers.map((b) => [b.id, b]));
}

function barberLines(published: SiteContent, draft: SiteContent): string[] {
  const lines: string[] = [];
  const before = byId(published.barbers);
  const after = byId(draft.barbers);
  for (const b of draft.barbers) if (!before.has(b.id)) lines.push(`Added barber ${b.name}`);
  for (const b of published.barbers) if (!after.has(b.id)) lines.push(`Removed barber ${b.name}`);

  const keptBefore = published.barbers.filter((b) => after.has(b.id)).map((b) => b.id);
  const keptAfter = draft.barbers.filter((b) => before.has(b.id)).map((b) => b.id);
  if (!deepEqual(keptBefore, keptAfter)) lines.push("Reordered barbers");

  for (const b of draft.barbers) {
    const old = before.get(b.id);
    if (!old) continue;
    if (old.name !== b.name) lines.push(`Renamed barber ${old.name} → ${b.name}`);
    if (old.days !== b.days) lines.push(`${b.name}: working days changed`);
    if (old.whatsApp !== b.whatsApp) lines.push(`${b.name}: WhatsApp number changed`);
  }
  return lines;
}

/** Cell keys of an item: its folded option labels, or one unnamed cell when it has none. */
function cellKeys(item: ItemContent): string[] {
  return item.options.length === 0 ? [""] : item.options.map((o) => o.trim().toLowerCase());
}

/** The price a barber pays for cell `index`: their own row when priced by barber, else the base. */
function effectiveCell(item: ItemContent, barberId: string | null, index: number) {
  if (!item.byBarber || barberId === null) return item.prices.base?.[index];
  const rows = item.prices.barbers;
  return rows && Object.hasOwn(rows, barberId) ? rows[barberId][index] : undefined;
}

/**
 * Whether any price someone could book changed: per barber kept on both sides (or the one base row
 * when neither side is priced by barber) and per option on both sides, matched by label. Prices
 * that only moved with their option, or came and went with a barber or option, don't count: the
 * option and barber lines already report those.
 */
function itemPricesChanged(old: ItemContent, now: ItemContent, keptIds: readonly string[]) {
  const ids: (string | null)[] = old.byBarber || now.byBarber ? [...keptIds] : [null];
  const oldKeys = cellKeys(old);
  return cellKeys(now).some((key, index) => {
    const oldIndex = oldKeys.indexOf(key);
    if (oldIndex === -1) return false;
    return ids.some((id) => effectiveCell(old, id, oldIndex) !== effectiveCell(now, id, index));
  });
}

/** Per service: options, the barber axis and prices. */
function priceLines(published: SiteContent, draft: SiteContent): string[] {
  const lines: string[] = [];
  const after = byId(draft.barbers);
  const keptIds = published.barbers.filter((b) => after.has(b.id)).map((b) => b.id);
  for (const category of CATEGORY_KEYS) {
    for (const item of MENU_STRUCTURE[category].items) {
      const old = itemOf(published, category, item.key);
      const now = itemOf(draft, category, item.key);
      if (!old || !now) continue;
      if (!deepEqual(old.options, now.options)) lines.push(`${item.name}: options changed`);
      if (old.byBarber !== now.byBarber) {
        lines.push(`${item.name}: barber option turned ${now.byBarber ? "on" : "off"}`);
      }
      if (itemPricesChanged(old, now, keptIds)) lines.push(`${item.name}: prices changed`);
    }
  }
  return lines;
}

function copyLines(published: SiteContent, draft: SiteContent): string[] {
  const lines: string[] = [];
  for (const category of CATEGORY_KEYS) {
    const structure = MENU_STRUCTURE[category];
    const old = published.services[category];
    const now = draft.services[category];
    if (!deepEqual(old.intro, now.intro)) lines.push(`${structure.name}: intro text changed`);
    for (const item of structure.items) {
      const a = itemOf(published, category, item.key);
      const b = itemOf(draft, category, item.key);
      if (a?.desc !== b?.desc || a?.ideal !== b?.ideal || a?.note !== b?.note) {
        lines.push(`${item.name}: text changed`);
      }
    }
  }
  if (published.sharedNotes.chemical !== draft.sharedNotes.chemical)
    lines.push("Chemical services note changed");
  return lines;
}

/** Identifies an image file: same key means the same picture, whatever its alt text. */
function fileKey(ref: ImageRef): string {
  return `${ref.path}|${ref.width}|${ref.height}`;
}

/**
 * A service's photo changes. Count changes are adds and removes; a new file beyond what an add
 * explains is a replacement. Alt text is compared for files on both sides.
 */
function itemPhotoLines(name: string, old: ItemContent, now: ItemContent): string[] {
  const lines: string[] = [];
  const oldByFile = new Map(old.photos.map((photo) => [fileKey(photo), photo]));
  const newFiles = now.photos.filter((photo) => !oldByFile.has(fileKey(photo))).length;
  const added = Math.max(0, now.photos.length - old.photos.length);
  if (newFiles > added) lines.push(`${name}: photo replaced`);
  if (now.photos.length > old.photos.length) lines.push(`${name}: photo added`);
  if (now.photos.length < old.photos.length) lines.push(`${name}: photo removed`);
  const altChanged = now.photos.some((photo) => {
    const before = oldByFile.get(fileKey(photo));
    return before !== undefined && before.alt !== photo.alt;
  });
  if (altChanged) lines.push(`${name}: photo alt text changed`);
  return lines;
}

function imageLines(published: SiteContent, draft: SiteContent): string[] {
  const lines: string[] = [];
  for (const slot of IMAGE_SLOTS) {
    const old = published.images[slot];
    const now = draft.images[slot];
    if (fileKey(old) !== fileKey(now)) lines.push(`Photo replaced: ${slot}`);
    if (old.alt !== now.alt) lines.push(`Alt text changed: ${slot}`);
  }
  for (const category of CATEGORY_KEYS) {
    for (const item of MENU_STRUCTURE[category].items) {
      const old = itemOf(published, category, item.key);
      const now = itemOf(draft, category, item.key);
      if (old && now) lines.push(...itemPhotoLines(item.name, old, now));
    }
  }
  return lines;
}

function heroLines(published: SiteContent, draft: SiteContent): string[] {
  return deepEqual(published.hero, draft.hero) ? [] : ["Hero captions changed"];
}

function reviewById(reviews: readonly Review[]): Map<string, Review> {
  return new Map(reviews.map((r) => [r.id, r]));
}

/** Stats (score, count, stars), then reviews added, removed, edited and reordered, matched by id. */
function reviewLines(published: SiteContent, draft: SiteContent): string[] {
  const lines: string[] = [];
  const old = published.reviews;
  const now = draft.reviews;
  if (old.score !== now.score || old.count !== now.count || old.stars !== now.stars) {
    lines.push("Review stats changed");
  }

  const before = reviewById(old.items);
  const after = reviewById(now.items);
  for (const r of now.items) if (!before.has(r.id)) lines.push(`Review added: ${r.author}`);
  for (const r of old.items) if (!after.has(r.id)) lines.push(`Review removed: ${r.author}`);
  for (const r of now.items) {
    const prev = before.get(r.id);
    if (prev && (prev.quote !== r.quote || prev.author !== r.author)) {
      lines.push(`Review edited: ${r.author}`);
    }
  }

  const keptBefore = old.items.filter((r) => after.has(r.id)).map((r) => r.id);
  const keptAfter = now.items.filter((r) => before.has(r.id)).map((r) => r.id);
  if (!deepEqual(keptBefore, keptAfter)) lines.push("Reviews reordered");
  return lines;
}

/** Human-readable changes from `published` to `draft`: barbers, options and prices, copy, hours,
 *  number, images (site slots, then service photos), hero captions, reviews. */
export function summarizeChanges(published: SiteContent, draft: SiteContent): string[] {
  return [
    ...barberLines(published, draft),
    ...priceLines(published, draft),
    ...copyLines(published, draft),
    ...(deepEqual(published.business.hours, draft.business.hours) ? [] : ["Opening hours changed"]),
    ...(published.business.defaultWhatsApp === draft.business.defaultWhatsApp
      ? []
      : ["Default WhatsApp number changed"]),
    ...imageLines(published, draft),
    ...heroLines(published, draft),
    ...reviewLines(published, draft),
  ];
}
