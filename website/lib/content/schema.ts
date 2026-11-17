import { z } from "zod";
import { migrateV1toV2, siteContentV1Schema } from "@/lib/content/legacy-v1";
import {
  CATEGORY_KEYS,
  IMAGE_SLOTS,
  barberListSchema,
  businessSchema,
  formatIssues,
  imageRefSchema,
  priceSchema,
  sharedNotesSchema,
  textSchema,
  whatsAppSchema,
} from "@/lib/content/primitives";
import type { CategoryKey } from "@/lib/content/primitives";
import {
  DEFAULT_HERO,
  DEFAULT_REVIEWS,
  heroSchema,
  reviewsSchema,
} from "@/lib/content/site-copy";
import { checkStructure } from "@/lib/content/structure";

export type { Hero, HeroCaption, Review, Reviews } from "@/lib/content/site-copy";

/** Editable site content (version 2): schema, derived types and validation. Canonical values only. */

export { CATEGORY_KEYS, IMAGE_PATH_PATTERN, IMAGE_SLOTS } from "@/lib/content/primitives";
export type {
  CategoryKey,
  DayOfWeek,
  ImageRef,
  ImageSlot,
  OpeningHours,
} from "@/lib/content/primitives";

const barberSchema = z.object({
  id: z.uuid(),
  name: textSchema,
  days: textSchema,
  whatsApp: whatsAppSchema,
});
export type Barber = z.infer<typeof barberSchema>;

/** Exactly one shape is present: `base` when the item's byBarber is false, else `barbers` (one row
 *  per barber id). Each row has `max(1, options.length)` cells. Enforced by checkStructure. */
const itemPricesSchema = z.object({
  base: z.array(priceSchema).optional(),
  barbers: z.record(z.string(), z.array(priceSchema)).optional(),
});
export type ItemPrices = z.infer<typeof itemPricesSchema>;

const itemContentSchema = z.object({
  options: z.array(z.string()),
  byBarber: z.boolean(),
  prices: itemPricesSchema,
  desc: z.string(),
  ideal: z.string(),
  note: z.string().optional(),
  photos: z.union([z.tuple([imageRefSchema]), z.tuple([imageRefSchema, imageRefSchema])], {
    error: "Expected 1 or 2 photos",
  }),
});
export type ItemContent = z.infer<typeof itemContentSchema>;

const categoryContentSchema = z.object({
  intro: z.tuple([z.string(), z.string()]),
  items: z.record(z.string(), itemContentSchema),
});
export type CategoryContent = z.infer<typeof categoryContentSchema>;

export const siteContentSchema = z.object({
  version: z.literal(2),
  business: businessSchema,
  barbers: barberListSchema(barberSchema),
  services: z.record(z.enum(CATEGORY_KEYS), categoryContentSchema),
  sharedNotes: sharedNotesSchema,
  images: z.record(z.enum(IMAGE_SLOTS), imageRefSchema),
  // Defaults let stored rows that predate these fields still parse.
  hero: heroSchema.default(() => structuredClone(DEFAULT_HERO)),
  reviews: reviewsSchema.default(() => structuredClone(DEFAULT_REVIEWS)),
});
export type SiteContent = z.infer<typeof siteContentSchema>;

/** Storage folder for an item's uploaded modal photos, e.g. `item.cut.cutting`. */
export function itemPhotoFolder(category: CategoryKey, item: string): string {
  return `item.${category}.${item}`;
}

/** Every image path the content references: site slots and every item's photos (deduplicated). */
export function contentImagePaths(c: SiteContent): string[] {
  const paths = new Set(Object.values(c.images).map((image) => image.path));
  for (const category of Object.values(c.services)) {
    for (const item of Object.values(category.items)) {
      for (const photo of item.photos) paths.add(photo.path);
    }
  }
  return [...paths];
}

export type ParseSiteContentResult =
  { ok: true; content: SiteContent } | { ok: false; issues: string[] };

function isV1(input: unknown): boolean {
  return typeof input === "object" && input !== null && "version" in input && input.version === 1;
}

/**
 * Slots removed from the content model: priceList. Stored rows may still carry them, so they are
 * dropped before validation instead of being rejected. Non-mutating.
 */
function withoutRemovedSlots(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const images: unknown = Reflect.get(raw, "images");
  if (typeof images !== "object" || images === null || Array.isArray(images)) return raw;
  return {
    ...raw,
    images: Object.fromEntries(Object.entries(images).filter(([slot]) => slot !== "priceList")),
  };
}

/** Validates content. Version 1 input (old stored rows) is migrated to version 2 first. */
export function parseSiteContent(rawInput: unknown): ParseSiteContentResult {
  const input = withoutRemovedSlots(rawInput);
  let candidate = input;
  if (isV1(input)) {
    const v1 = siteContentV1Schema.safeParse(input);
    if (!v1.success) return { ok: false, issues: formatIssues(v1.error) };
    candidate = migrateV1toV2(v1.data);
  }
  const result = siteContentSchema.safeParse(candidate);
  if (!result.success) return { ok: false, issues: formatIssues(result.error) };
  const issues = checkStructure(result.data);
  return issues.length === 0 ? { ok: true, content: result.data } : { ok: false, issues };
}
