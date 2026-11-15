import { z } from "zod";
import {
  CATEGORY_KEYS,
  IMAGE_SLOTS,
  barberListSchema,
  businessSchema,
  imageRefSchema,
  priceSchema,
  sharedNotesSchema,
  textSchema,
  whatsAppSchema,
} from "@/lib/content/primitives";
import type { CategoryKey, ImageRef } from "@/lib/content/primitives";
// Type-only: schema.ts imports this module at runtime to migrate v1 input.
import type { ItemContent, SiteContent } from "@/lib/content/schema";
import { DEFAULT_HERO, DEFAULT_REVIEWS } from "@/lib/content/site-copy";
import { LENGTHS } from "@/lib/content/structure";

/**
 * Content version 1 (barber-owned cut prices, fixed price layouts, per-category dialog photos).
 * Stored rows may still be v1; parseSiteContent reads them through migrateV1toV2.
 */

const IMAGE_SLOTS_V1 = [
  ...IMAGE_SLOTS,
  "dialog.cut.0",
  "dialog.cut.1",
  "dialog.colour.0",
  "dialog.colour.1",
  "dialog.perm.0",
  "dialog.perm.1",
  "dialog.treat.0",
  "dialog.treat.1",
] as const;

const barberSchema = z.object({
  id: z.uuid(),
  name: textSchema,
  days: textSchema,
  whatsApp: whatsAppSchema,
  cutPrices: z.tuple([priceSchema, priceSchema, priceSchema]),
});

const itemContentSchema = z.object({
  prices: z.array(priceSchema).optional(),
  range: z.string().optional(),
  desc: z.string(),
  ideal: z.string(),
  note: z.string().optional(),
});

const categoryContentSchema = z.object({
  intro: z.tuple([z.string(), z.string()]),
  items: z.record(z.string(), itemContentSchema),
});

export const siteContentV1Schema = z.object({
  version: z.literal(1),
  business: businessSchema,
  barbers: barberListSchema(barberSchema),
  services: z.record(z.enum(CATEGORY_KEYS), categoryContentSchema),
  sharedNotes: sharedNotesSchema,
  images: z.record(z.enum(IMAGE_SLOTS_V1), imageRefSchema),
});
export type SiteContentV1 = z.infer<typeof siteContentV1Schema>;
type ItemContentV1 = z.infer<typeof itemContentSchema>;

/** v1 column labels of the cutting table (one price per column on each barber). */
const V1_CUT_COLUMNS = ["Gentleman", "Ladies", "Under 12s"] as const;

/** v1 "table" items and their columns. Every other non-cut item was a "range" item. */
const V1_TABLE_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  roots: LENGTHS,
  fullColour: LENGTHS,
  halfHighlights: LENGTHS,
  fullHighlights: LENGTHS,
  coolPerm: LENGTHS,
  halfPerm: ["Short"],
  ionStraightening: LENGTHS,
};

function migrateItem(
  v1: SiteContentV1,
  category: CategoryKey,
  key: string,
  item: ItemContentV1,
  photos: [ImageRef, ImageRef],
): ItemContent {
  const text = {
    desc: item.desc,
    ideal: item.ideal,
    ...(item.note === undefined ? {} : { note: item.note }),
  };
  const range = item.range ?? "–";
  const perBarber = (row: (b: SiteContentV1["barbers"][number]) => string[]) =>
    Object.fromEntries(v1.barbers.map((b) => [b.id, row(b)]));

  if (category === "cut") {
    const cutting = key === "cutting";
    return {
      options: cutting ? [...V1_CUT_COLUMNS] : [],
      byBarber: true,
      prices: { barbers: perBarber((b) => (cutting ? [...b.cutPrices] : [range])) },
      ...text,
      photos,
    };
  }
  const columns = Object.hasOwn(V1_TABLE_COLUMNS, key) ? V1_TABLE_COLUMNS[key] : undefined;
  return columns
    ? {
        options: [...columns],
        byBarber: false,
        prices: { base: [...(item.prices ?? [])] },
        ...text,
        photos,
      }
    : { options: [], byBarber: false, prices: { base: [range] }, ...text, photos };
}

/**
 * Maps v1 content onto v2: cut prices move onto Cutting & Finishing as per-barber rows, the other
 * cut items get every barber's row set to their range, colour/perm tables keep their columns as
 * options with base prices, range items get one base price, and each item gets its category's two
 * dialog photos. Pure: the input is not modified and nothing is shared with it. The result is not
 * validated; parseSiteContent does that.
 */
export function migrateV1toV2(input: SiteContentV1): SiteContent {
  const v1 = structuredClone(input);
  const services = Object.fromEntries(
    CATEGORY_KEYS.map((category) => {
      const { intro, items } = v1.services[category];
      const photos = (): [ImageRef, ImageRef] => [
        { ...v1.images[`dialog.${category}.0`] },
        { ...v1.images[`dialog.${category}.1`] },
      ];
      const migrated = Object.fromEntries(
        Object.entries(items).map(([key, item]) => [
          key,
          migrateItem(v1, category, key, item, photos()),
        ]),
      );
      return [category, { intro, items: migrated }];
    }),
  ) as SiteContent["services"];

  return {
    version: 2,
    business: v1.business,
    barbers: v1.barbers.map(({ id, name, days, whatsApp }) => ({ id, name, days, whatsApp })),
    services,
    sharedNotes: v1.sharedNotes,
    images: Object.fromEntries(
      IMAGE_SLOTS.map((slot) => [slot, v1.images[slot]]),
    ) as SiteContent["images"],
    hero: structuredClone(DEFAULT_HERO),
    reviews: structuredClone(DEFAULT_REVIEWS),
  };
}

/** Today's site content in the v1 shape. DEFAULT_CONTENT (defaults.ts) is its v2 migration. */

const PORTRAIT_COLOUR_ALT = "Client with a sleek shoulder-length cut on a rooftop at golden hour";
const BOB_COPPER_ALT = "Client with a copper bob, eyes lowered";
const PORTRAIT_MONO_ALT = "Black and white profile portrait of a client";
const PARLOR_ALT = "Rave’s Parlor reception desk and salon floor";

const portraitColour = (alt: string) => ({
  path: "/images/portrait-colour.jpg",
  alt,
  width: 1198,
  height: 1597,
});
const bobCopper = (alt: string) => ({
  path: "/images/bob-copper.jpg",
  alt,
  width: 698,
  height: 1102,
});
const portraitMono = (alt: string) => ({
  path: "/images/portrait-mono.jpg",
  alt,
  width: 739,
  height: 982,
});
const parlor = (alt: string) => ({
  path: "/images/parlor-reception.jpg",
  alt,
  width: 1253,
  height: 832,
});

const CHEM = "Chemical services don’t include a haircut, wash or finish — add one when you book.";

export const DEFAULT_CONTENT_V1: SiteContentV1 = {
  version: 1,
  business: {
    defaultWhatsApp: "447789096148",
    hours: [
      {
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        days: "Mon – Sat",
        shortDays: "Mon – Sat",
        open: "10:00",
        close: "19:00",
        lastAppointment: "18:00",
      },
      {
        dayOfWeek: ["Sunday"],
        days: "Sunday",
        shortDays: "Sun",
        open: "10:00",
        close: "18:00",
        lastAppointment: "17:00",
      },
    ],
  },
  barbers: [
    {
      id: "7b1f0c52-3a4e-4c1d-9a6b-1d2e3f4a5b61",
      name: "Rave",
      days: "Mon, Thu, Fri, Sat & Sun",
      whatsApp: "447789096148",
      cutPrices: ["£55", "£80", "£35"],
    },
    {
      id: "8c2a1d63-4b5f-4d2e-8b7c-2e3f4a5b6c72",
      name: "John",
      days: "Tue, Wed, Thu, Fri & occasional Sat",
      whatsApp: "447789096148",
      cutPrices: ["£45", "£60", "£30"],
    },
    {
      id: "9d3b2e74-5c60-4e3f-9c8d-3f4a5b6c7d83",
      name: "Julian",
      days: "Thu, Fri, Sat & Sun",
      whatsApp: "447789096148",
      cutPrices: ["£40", "£65", "£30"],
    },
  ],
  services: {
    cut: {
      intro: [
        "Every appointment starts with a conversation about how you wear your hair. Cuts are shaped to your texture and routine, then finished so you leave ready.",
        "Choose from Rave, John or Julian. Styling and up-dos are available for events, weddings and nights out.",
      ],
      items: {
        cutting: {
          desc: "A consultation, precision cut, wash and finish with Rave, John or Julian.",
          ideal: "Regular trims, a change of shape, or a complete restyle.",
          note: "Prices depend on your barber. All haircut services include wash and finishing.",
        },
        cleansing: {
          range: "£30 – £40",
          desc: "A wash with a blow-dry or style — sleek, smooth or full of volume.",
          ideal: "A reset between cuts, or looking polished for an evening out.",
          note: "Priced for ladies. The same with Rave, John and Julian.",
        },
        updo: {
          range: "£30 – £80",
          desc: "Pinned and set styles, from soft and loose to sculpted. Price depends on length and detail.",
          ideal: "Weddings, parties and special occasions.",
          note: "Priced for ladies. The same with Rave, John and Julian.",
        },
      },
    },
    colour: {
      intro: [
        "From natural tones to statement shades like copper, colour is matched to your skin tone and the look you’re after.",
        "Highlights add brightness and dimension; technical work is priced after a consultation.",
      ],
      items: {
        roots: {
          prices: ["£80", "–", "–"],
          desc: "Colour applied to the regrowth at the roots, keeping your colour seamless between full colour appointments.",
          ideal: "Covering regrowth and greys between full colour appointments.",
        },
        fullColour: {
          prices: ["£80", "£100", "£120"],
          desc: "All-over colour, from rich natural shades to vivid statement tones.",
          ideal: "Covering greys, refreshing faded colour or a complete change.",
        },
        halfHighlights: {
          prices: ["£100", "£110", "£130"],
          desc: "Highlights through the top and sides, where light naturally falls.",
          ideal: "A softer lift, or topping up between full head appointments.",
        },
        fullHighlights: {
          prices: ["£100", "£120", "£150"],
          desc: "Highlights woven through the whole head for brightness and dimension.",
          ideal: "A noticeable lift with a natural, blended finish.",
        },
        technicalHighlight: {
          range: "£100 – £220+",
          desc: "Advanced placement for a tailored, seamless blend. Priced after a consultation.",
          ideal: "Detailed, high-impact colour work.",
        },
        bleach: {
          range: "£70 – £100",
          desc: "Lightening through the whole head, as a base for pale blondes or vivid shades.",
          ideal: "Going significantly lighter.",
        },
      },
    },
    perm: {
      intro: [
        "Add soft movement and body with a perm, or go sleek with long-lasting ion straightening.",
        "Prices depend on hair length.",
      ],
      items: {
        coolPerm: {
          prices: ["£100", "£120", "£150"],
          desc: "A cool perm for soft, natural-looking movement and body.",
          ideal: "Adding texture and volume that lasts.",
        },
        halfPerm: {
          prices: ["£90"],
          desc: "Volume and texture through the top section only.",
          ideal: "Shorter styles that need lift on top.",
        },
        ionStraightening: {
          prices: ["£120", "£170", "£200"],
          desc: "Long-lasting straightening for smooth, sleek, frizz-free hair.",
          ideal: "Taming frizz and cutting down daily styling time.",
        },
      },
    },
    treat: {
      intro: [
        "Olaplex repairs broken bonds inside the hair, protecting it through colour, bleach and perm services.",
        "Add it to any chemical service, or relax with a Kérastase scalp spa.",
      ],
      items: {
        olaplex: {
          range: "£30",
          desc: "Professional bond-building treatment: No.1 before your chemical service, No.2 to finish.",
          ideal: "Anyone colouring, lightening or perming — especially regular bleach.",
        },
        scalpSpa: {
          range: "£15",
          desc: "A Kérastase scalp spa treatment with serum, to relax the scalp.",
          ideal: "A calming treat alongside your haircut or chemical service.",
        },
      },
    },
  },
  sharedNotes: { chemical: CHEM },
  images: {
    heroLeft: portraitColour(PORTRAIT_COLOUR_ALT),
    heroRight: bobCopper(BOB_COPPER_ALT),
    split: portraitMono(PORTRAIT_MONO_ALT),
    parlor: parlor(PARLOR_ALT),
    priceList: {
      path: "/images/price-list.webp",
      alt: "Rave’s Parlor London price list: hair cut and blow-dry prices for Rave, John and Julian, colour and highlights, perm, and hair treatments. All chemical services exclude haircut, wash and finishing.",
      width: 1491,
      height: 1055,
    },
    "overview.cut": portraitColour(PORTRAIT_COLOUR_ALT),
    "overview.colour": bobCopper(BOB_COPPER_ALT),
    "overview.perm": portraitMono(PORTRAIT_MONO_ALT),
    "overview.treat": parlor(PARLOR_ALT),
    "media.cut": portraitColour(PORTRAIT_COLOUR_ALT),
    "media.colour": bobCopper(BOB_COPPER_ALT),
    "media.perm": portraitMono(PORTRAIT_MONO_ALT),
    "media.treat": parlor(PARLOR_ALT),
    "dialog.cut.0": portraitColour(PORTRAIT_COLOUR_ALT),
    "dialog.cut.1": portraitMono(PORTRAIT_MONO_ALT),
    "dialog.colour.0": bobCopper(BOB_COPPER_ALT),
    "dialog.colour.1": portraitColour(PORTRAIT_COLOUR_ALT),
    "dialog.perm.0": portraitMono(PORTRAIT_MONO_ALT),
    "dialog.perm.1": bobCopper(BOB_COPPER_ALT),
    "dialog.treat.0": parlor(PARLOR_ALT),
    "dialog.treat.1": bobCopper(BOB_COPPER_ALT),
  },
};
