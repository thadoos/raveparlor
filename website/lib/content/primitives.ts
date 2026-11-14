import { z } from "zod";
import { PRICE_PATTERN, WHATSAPP_PATTERN } from "@/lib/content/normalize";

/**
 * Zod building blocks shared by the current content schema (schema.ts) and the legacy v1 schema
 * (legacy-v1.ts). Kept separate so neither imports the other's runtime values in a cycle.
 */

export const CATEGORY_KEYS = ["cut", "colour", "perm", "treat"] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/** Site-wide image slots. Per-service modal photos live on each item instead. */
export const IMAGE_SLOTS = [
  "heroLeft",
  "heroRight",
  "split",
  "parlor",
  "priceList",
  "overview.cut",
  "overview.colour",
  "overview.perm",
  "overview.treat",
  "media.cut",
  "media.colour",
  "media.perm",
  "media.treat",
] as const;
export type ImageSlot = (typeof IMAGE_SLOTS)[number];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const priceSchema = z.string().regex(PRICE_PATTERN, "Price must look like £80 or £30 – £40");
const timeSchema = z.string().regex(TIME_PATTERN, "Time must be HH:MM");
export const textSchema = z.string().trim().min(1, "Required");

const dayOfWeekSchema = z.enum([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;

const openingHoursSchema = z
  .object({
    dayOfWeek: z.array(dayOfWeekSchema).min(1),
    days: textSchema,
    shortDays: textSchema,
    open: timeSchema,
    close: timeSchema,
    lastAppointment: timeSchema,
  })
  .refine((h) => h.open < h.close, {
    message: "Opening time must be before closing time",
    path: ["close"],
  })
  .refine((h) => h.lastAppointment >= h.open && h.lastAppointment <= h.close, {
    message: "Last appointment must be between opening and closing time",
    path: ["lastAppointment"],
  });
export type OpeningHours = z.infer<typeof openingHoursSchema>;

/** A bundled file under /images, or an uploaded storage key: `<folder>/<uuid>.<webp|jpg>`, where the
 *  folder is an image slot or an item photo folder such as `item.cut.cutting` (see ImageSlotEditor).
 *  Anything else (URLs, protocol-relative "//host", bare "/") is rejected. */
export const IMAGE_PATH_PATTERN = /^(\/images\/[\w./-]+|[\w.]+\/[0-9a-f-]{36}\.(webp|jpg))$/;

export const imageRefSchema = z.object({
  path: z.string().regex(IMAGE_PATH_PATTERN, "Image path must be /images/... or an uploaded photo"),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type ImageRef = z.infer<typeof imageRefSchema>;

export const whatsAppSchema = z
  .string()
  .regex(WHATSAPP_PATTERN, "WhatsApp number must be digits only, e.g. 447789096148");

export const businessSchema = z.object({
  defaultWhatsApp: whatsAppSchema,
  hours: z.array(openingHoursSchema).min(1, "At least one opening hours entry is required"),
});

/** A non-empty barber list with case-insensitively unique names. */
export function barberListSchema<T extends z.ZodType<{ name: string }>>(barber: T) {
  return z
    .array(barber)
    .min(1, "At least one barber is required")
    .refine(
      (barbers) => new Set(barbers.map((b) => b.name.trim().toLowerCase())).size === barbers.length,
      {
        message: "Barber names must be unique",
      },
    );
}

export const sharedNotesSchema = z.object({ chemical: z.string() });

/** Flattens zod issues into "path: message" strings. */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}
