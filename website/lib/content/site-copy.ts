import { z } from "zod";
import { textSchema } from "@/lib/content/primitives";

/**
 * Editable public copy: the two hero captions and the reviews block. Imports only primitives and zod
 * so schema.ts and legacy-v1.ts can both use it without an import cycle.
 */

export const REVIEW_QUOTE_MAX = 500;
export const REVIEW_AUTHOR_MAX = 80;

const heroCaptionSchema = z.object({
  title: textSchema,
});
export type HeroCaption = z.infer<typeof heroCaptionSchema>;

export const heroSchema = z.object({
  left: heroCaptionSchema,
  right: heroCaptionSchema,
});
export type Hero = z.infer<typeof heroSchema>;

export const reviewSchema = z.object({
  id: z.uuid(),
  quote: textSchema.max(REVIEW_QUOTE_MAX),
  author: textSchema.max(REVIEW_AUTHOR_MAX),
});
export type Review = z.infer<typeof reviewSchema>;

export const reviewsSchema = z.object({
  score: z.number().min(0).max(5),
  count: z.number().int().min(0),
  stars: z.number().int().min(1).max(5),
  items: z.array(reviewSchema).min(1, "At least one review is required"),
});
export type Reviews = z.infer<typeof reviewsSchema>;

export const DEFAULT_HERO: Hero = {
  left: { title: "Cutting & Finishing" },
  right: { title: "Full Head Colour" },
};

/**
 * Real Google reviews from the salon's Maps listing, copied word for word with the reviewer's name
 * as shown on Google. Long reviews are cut down to one or two whole sentences. Staff names are left
 * out on purpose.
 */
export const DEFAULT_REVIEWS: Reviews = {
  score: 4.9,
  count: 202,
  stars: 5,
  items: [
    {
      id: "a1b2c3d4-0001-4000-8000-000000000001",
      quote: "Exceptional experience! The staff were all friendly and patient.",
      author: "Diyaco Shwany",
    },
    {
      id: "a1b2c3d4-0002-4000-8000-000000000002",
      quote:
        "He took the time to understand what I wanted and, even more importantly, helped me choose and design a hairstyle that really suits me.",
      author: "Nathan Tse",
    },
    {
      id: "a1b2c3d4-0003-4000-8000-000000000003",
      quote:
        "The stylist took the time to design the perfect hairstyle for me, and the head massage during the shampoo nearly put me to sleep.",
      author: "s yancy",
    },
    {
      id: "a1b2c3d4-0004-4000-8000-000000000004",
      quote: "He pays so much attention to detail and always gets the cut just right.",
      author: "Yiran Wang",
    },
    {
      id: "a1b2c3d4-0005-4000-8000-000000000005",
      quote: "Finally found a hairdresser I really love!",
      author: "Hoi Lun Cheung",
    },
  ],
};
