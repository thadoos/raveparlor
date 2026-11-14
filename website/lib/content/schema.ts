import { z } from "zod";
import { PRICE_PATTERN, WHATSAPP_PATTERN } from "@/lib/content/normalize";
import { checkStructure } from "@/lib/content/structure";

/** Editable site content: schema, derived types and validation. Canonical values only. */

export const CATEGORY_KEYS = ["cut", "colour", "perm", "treat"] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

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
  "dialog.cut.0",
  "dialog.cut.1",
  "dialog.colour.0",
  "dialog.colour.1",
  "dialog.perm.0",
  "dialog.perm.1",
  "dialog.treat.0",
  "dialog.treat.1",
] as const;
export type ImageSlot = (typeof IMAGE_SLOTS)[number];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const priceSchema = z.string().regex(PRICE_PATTERN, "Price must look like £80 or £30 – £40");
const timeSchema = z.string().regex(TIME_PATTERN, "Time must be HH:MM");
const textSchema = z.string().trim().min(1, "Required");

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
  .refine((h) => h.open < h.close, { message: "Opening time must be before closing time", path: ["close"] })
  .refine((h) => h.lastAppointment >= h.open && h.lastAppointment <= h.close, {
    message: "Last appointment must be between opening and closing time",
    path: ["lastAppointment"],
  });
export type OpeningHours = z.infer<typeof openingHoursSchema>;

const imageRefSchema = z.object({
  path: textSchema,
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type ImageRef = z.infer<typeof imageRefSchema>;

const whatsAppSchema = z.string().regex(WHATSAPP_PATTERN, "WhatsApp number must be digits only, e.g. 447789096148");

const barberSchema = z.object({
  id: z.uuid(),
  name: textSchema,
  days: textSchema,
  whatsApp: whatsAppSchema,
  cutPrices: z.tuple([priceSchema, priceSchema, priceSchema]),
});
export type Barber = z.infer<typeof barberSchema>;

const itemContentSchema = z.object({
  prices: z.array(priceSchema).optional(),
  range: z.string().optional(),
  desc: z.string(),
  ideal: z.string(),
  note: z.string().optional(),
});
export type ItemContent = z.infer<typeof itemContentSchema>;

const categoryContentSchema = z.object({
  intro: z.tuple([z.string(), z.string()]),
  items: z.record(z.string(), itemContentSchema),
});
export type CategoryContent = z.infer<typeof categoryContentSchema>;

export const siteContentSchema = z.object({
  version: z.literal(1),
  business: z.object({
    defaultWhatsApp: whatsAppSchema,
    hours: z.array(openingHoursSchema),
  }),
  barbers: z
    .array(barberSchema)
    .min(1, "At least one barber is required")
    .refine((barbers) => new Set(barbers.map((b) => b.name.trim().toLowerCase())).size === barbers.length, {
      message: "Barber names must be unique",
    }),
  services: z.record(z.enum(CATEGORY_KEYS), categoryContentSchema),
  sharedNotes: z.object({ chemical: z.string() }),
  images: z.record(z.enum(IMAGE_SLOTS), imageRefSchema),
});
export type SiteContent = z.infer<typeof siteContentSchema>;

export type ParseSiteContentResult = { ok: true; content: SiteContent } | { ok: false; issues: string[] };

export function parseSiteContent(input: unknown): ParseSiteContentResult {
  const result = siteContentSchema.safeParse(input);
  if (result.success) {
    const issues = checkStructure(result.data);
    return issues.length === 0 ? { ok: true, content: result.data } : { ok: false, issues };
  }
  return {
    ok: false,
    issues: result.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    }),
  };
}
