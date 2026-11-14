import { CATEGORY_KEYS, IMAGE_SLOTS } from "@/lib/content/schema";
import type { Barber, SiteContent } from "@/lib/content/schema";
import { CUT_COLUMNS, MENU_STRUCTURE } from "@/lib/content/structure";

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

function priceLines(published: SiteContent, draft: SiteContent): string[] {
  const lines: string[] = [];
  const before = byId(published.barbers);
  for (const b of draft.barbers) {
    const old = before.get(b.id);
    if (!old) continue;
    CUT_COLUMNS.forEach((column, i) => {
      if (old.cutPrices[i] !== b.cutPrices[i]) {
        lines.push(`${b.name}: ${column} ${old.cutPrices[i]} → ${b.cutPrices[i]}`);
      }
    });
  }
  for (const category of CATEGORY_KEYS) {
    for (const item of MENU_STRUCTURE[category].items) {
      const old = published.services[category].items[item.key];
      const now = draft.services[category].items[item.key];
      if (!deepEqual(old?.prices, now?.prices) || old?.range !== now?.range) {
        lines.push(`${item.name}: prices changed`);
      }
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
      const a = old.items[item.key];
      const b = now.items[item.key];
      if (a?.desc !== b?.desc || a?.ideal !== b?.ideal || a?.note !== b?.note) {
        lines.push(`${item.name}: text changed`);
      }
    }
  }
  if (published.sharedNotes.chemical !== draft.sharedNotes.chemical)
    lines.push("Chemical services note changed");
  return lines;
}

function imageLines(published: SiteContent, draft: SiteContent): string[] {
  const lines: string[] = [];
  for (const slot of IMAGE_SLOTS) {
    const old = published.images[slot];
    const now = draft.images[slot];
    if (old.path !== now.path || old.width !== now.width || old.height !== now.height) {
      lines.push(`Photo replaced: ${slot}`);
    }
    if (old.alt !== now.alt) lines.push(`Alt text changed: ${slot}`);
  }
  return lines;
}

/** Human-readable changes from `published` to `draft`: barbers, prices, copy, hours, number, images. */
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
  ];
}
