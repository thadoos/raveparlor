import { deepEqual } from "@/lib/admin/changes";
import { CATEGORY_KEYS } from "@/lib/content/schema";
import type { SiteContent } from "@/lib/content/schema";
import { MENU_STRUCTURE } from "@/lib/content/structure";

/** Things worth a second look before publishing. Advisory only: they never block a publish. */
export interface ContentWarning {
  kind: "poster" | "staleBarberName";
  message: string;
}

const POSTER_MESSAGE = "Prices changed. Remember to upload an updated price poster.";

const ITEM_FIELDS = [
  ["desc", "description"],
  ["ideal", "“ideal for” text"],
  ["note", "note"],
] as const;

/** The prices the poster shows: every barber's cut prices (adding or removing one counts) and every item price. */
function pricesChanged(published: SiteContent, draft: SiteContent): boolean {
  const barberPrices = (c: SiteContent) =>
    Object.fromEntries(c.barbers.map((b) => [b.id, b.cutPrices] as const));
  const itemPrices = (c: SiteContent) =>
    CATEGORY_KEYS.map((category) =>
      MENU_STRUCTURE[category].items.map(({ key }) => {
        const item = c.services[category].items[key];
        return { prices: item?.prices, range: item?.range };
      }),
    );
  return (
    !deepEqual(barberPrices(published), barberPrices(draft)) ||
    !deepEqual(itemPrices(published), itemPrices(draft))
  );
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Matches `name` as a whole word, ignoring case. Letters and digits on either side break the match. */
function wordPattern(name: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(name)}(?![\\p{L}\\p{N}])`, "iu");
}

/** Every copy field in the draft, labelled with its service and field. */
function copyFields(c: SiteContent): { label: string; text: string }[] {
  const fields: { label: string; text: string }[] = [];
  for (const category of CATEGORY_KEYS) {
    const structure = MENU_STRUCTURE[category];
    const content = c.services[category];
    content.intro.forEach((text, i) =>
      fields.push({ label: `${structure.name} intro (paragraph ${i + 1})`, text }),
    );
    for (const item of structure.items) {
      const data = content.items[item.key];
      if (!data) continue;
      for (const [key, name] of ITEM_FIELDS) {
        const text = data[key];
        if (text) fields.push({ label: `${item.name} ${name}`, text });
      }
    }
  }
  fields.push({ label: "The chemical services note", text: c.sharedNotes.chemical });
  return fields;
}

export function contentWarnings(published: SiteContent, draft: SiteContent): ContentWarning[] {
  const warnings: ContentWarning[] = [];
  if (
    pricesChanged(published, draft) &&
    published.images.priceList.path === draft.images.priceList.path
  ) {
    warnings.push({ kind: "poster", message: POSTER_MESSAGE });
  }

  const remaining = new Set(draft.barbers.map((b) => b.name.trim().toLowerCase()));
  const removed = published.barbers
    .map((b) => b.name.trim())
    .filter((name) => !remaining.has(name.toLowerCase()));
  if (removed.length === 0) return warnings;

  const fields = copyFields(draft);
  for (const name of removed) {
    const pattern = wordPattern(name);
    for (const field of fields) {
      if (pattern.test(field.text)) {
        warnings.push({
          kind: "staleBarberName",
          message: `${field.label} mentions ${name}, who is no longer a barber.`,
        });
      }
    }
  }
  return warnings;
}
