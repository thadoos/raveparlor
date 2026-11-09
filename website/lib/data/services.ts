import { PHOTOS } from "@/lib/data/images";

/** Service menu data (prices from the shop price list) and helpers derived from it. */

export type CategoryKey = "cut" | "colour" | "perm" | "treat";

export interface Barber {
  name: string;
  days: string;
}

export interface PriceRow {
  label: string;
  sub: string;
  prices: readonly string[];
}

export interface MenuItem {
  name: string;
  /** Column headings of the price table (e.g. hair lengths). */
  cols?: readonly string[];
  /** One row of prices, matching `cols`. Use "–" for "not offered". */
  prices?: readonly string[];
  /** Per-barber price rows, matching `cols`. */
  rows?: readonly PriceRow[];
  /** A single price or range, shown instead of a table. */
  range?: string;
  /** Lowest price, e.g. "£30". */
  from: string;
  single?: boolean;
  desc: string;
  ideal: string;
  note?: string;
}

export interface MenuCategory {
  name: string;
  images: readonly string[];
  media: string;
  mediaPos: string;
  /** Present when prices depend on the barber. */
  barbers?: readonly Barber[];
  intro: readonly string[];
  items: readonly MenuItem[];
}

export const BARBERS: readonly Barber[] = [
  { name: "Rave", days: "Mon, Thu, Fri, Sat & Sun" },
  { name: "John", days: "Tue, Wed, Thu, Fri & occasional Sat" },
  { name: "Julian", days: "Thu, Fri, Sat & Sun" },
];

/** Cutting & Finishing prices per barber (same order as `BARBERS`): Gentleman, Ladies, Under 12s. */
export const CUT_PRICES: readonly (readonly string[])[] = [
  ["£55", "£80", "£35"],
  ["£45", "£60", "£30"],
  ["£40", "£65", "£30"],
];

export const CHEM =
  "Chemical services don’t include a haircut, wash or finish — add one when you book.";

export const CATEGORY_ORDER: readonly CategoryKey[] = ["cut", "colour", "perm", "treat"];

const LENGTHS: readonly string[] = ["Short", "Medium", "Long"];

export const MENU: Record<CategoryKey, MenuCategory> = {
  cut: {
    name: "Cut & Style",
    images: [PHOTOS.portraitColour.src, PHOTOS.portraitMono.src],
    media: PHOTOS.portraitColour.src,
    mediaPos: "50% 30%",
    barbers: BARBERS,
    intro: [
      "Every appointment starts with a conversation about how you wear your hair. Cuts are shaped to your texture and routine, then finished so you leave ready.",
      "Choose from Rave, John or Julian. Styling and up-dos are available for events, weddings and nights out.",
    ],
    items: [
      {
        name: "Cutting & Finishing",
        cols: ["Gentleman", "Ladies", "Under 12s"],
        rows: BARBERS.map((barber, i) => ({
          label: barber.name,
          sub: barber.days,
          prices: CUT_PRICES[i],
        })),
        from: "£30",
        desc: "A consultation, precision cut, wash and finish with Rave, John or Julian.",
        ideal: "Regular trims, a change of shape, or a complete restyle.",
        note: "Prices depend on your barber. All haircut services include wash and finishing.",
      },
      {
        name: "Cleansing & Styling",
        range: "£30 – £40",
        from: "£30",
        desc: "A wash with a blow-dry or style — sleek, smooth or full of volume.",
        ideal: "A reset between cuts, or looking polished for an evening out.",
        note: "Priced for ladies. The same with Rave, John and Julian.",
      },
      {
        name: "Up-do Hairdressing",
        range: "£30 – £80",
        from: "£30",
        desc: "Pinned and set styles, from soft and loose to sculpted. Price depends on length and detail.",
        ideal: "Weddings, parties and special occasions.",
        note: "Priced for ladies. The same with Rave, John and Julian.",
      },
    ],
  },
  colour: {
    name: "Colour & Highlights",
    images: [PHOTOS.bobCopper.src, PHOTOS.portraitColour.src],
    media: PHOTOS.bobCopper.src,
    mediaPos: "50% 30%",
    intro: [
      "From natural tones to statement shades like copper, colour is matched to your skin tone and the look you’re after.",
      "Highlights add brightness and dimension; technical work is priced after a consultation.",
    ],
    items: [
      {
        name: "Root Retouching",
        cols: LENGTHS,
        prices: ["£80", "–", "–"],
        from: "£80",
        desc: "Colour applied to the regrowth at the roots, keeping your colour seamless between full colour appointments.",
        ideal: "Covering regrowth and greys between full colour appointments.",
        note: CHEM,
      },
      {
        name: "Full Head Colour",
        cols: LENGTHS,
        prices: ["£80", "£100", "£120"],
        from: "£80",
        desc: "All-over colour, from rich natural shades to vivid statement tones.",
        ideal: "Covering greys, refreshing faded colour or a complete change.",
        note: CHEM,
      },
      {
        name: "Half Head Highlights",
        cols: LENGTHS,
        prices: ["£100", "£110", "£130"],
        from: "£100",
        desc: "Highlights through the top and sides, where light naturally falls.",
        ideal: "A softer lift, or topping up between full head appointments.",
        note: CHEM,
      },
      {
        name: "Full Head Highlights",
        cols: LENGTHS,
        prices: ["£100", "£120", "£150"],
        from: "£100",
        desc: "Highlights woven through the whole head for brightness and dimension.",
        ideal: "A noticeable lift with a natural, blended finish.",
        note: CHEM,
      },
      {
        name: "Technical Highlight",
        range: "£100 – £220+",
        from: "£100",
        desc: "Advanced placement for a tailored, seamless blend. Priced after a consultation.",
        ideal: "Detailed, high-impact colour work.",
        note: CHEM,
      },
      {
        name: "Full Head Bleach",
        range: "£70 – £100",
        from: "£70",
        desc: "Lightening through the whole head, as a base for pale blondes or vivid shades.",
        ideal: "Going significantly lighter.",
        note: CHEM,
      },
    ],
  },
  perm: {
    name: "Perm & Straightening",
    images: [PHOTOS.portraitMono.src, PHOTOS.bobCopper.src],
    media: PHOTOS.portraitMono.src,
    mediaPos: "50% 30%",
    intro: [
      "Add soft movement and body with a perm, or go sleek with long-lasting ion straightening.",
      "Prices depend on hair length.",
    ],
    items: [
      {
        name: "Technical Perm (Cool Perm)",
        cols: LENGTHS,
        prices: ["£100", "£120", "£150"],
        from: "£100",
        desc: "A cool perm for soft, natural-looking movement and body.",
        ideal: "Adding texture and volume that lasts.",
        note: CHEM,
      },
      {
        name: "Half-Head Perm on Top",
        cols: ["Short"],
        prices: ["£90"],
        from: "£90",
        desc: "Volume and texture through the top section only.",
        ideal: "Shorter styles that need lift on top.",
        note: CHEM,
      },
      {
        name: "Ion Straightening",
        cols: LENGTHS,
        prices: ["£120", "£170", "£200"],
        from: "£120",
        desc: "Long-lasting straightening for smooth, sleek, frizz-free hair.",
        ideal: "Taming frizz and cutting down daily styling time.",
        note: CHEM,
      },
    ],
  },
  treat: {
    name: "Treatments",
    images: [PHOTOS.parlorReception.src, PHOTOS.bobCopper.src],
    media: PHOTOS.parlorReception.src,
    mediaPos: "40% 50%",
    intro: [
      "Olaplex repairs broken bonds inside the hair, protecting it through colour, bleach and perm services.",
      "Add it to any chemical service, or relax with a Kérastase scalp spa.",
    ],
    items: [
      {
        name: "Olaplex No.1 & No.2",
        range: "£30",
        from: "£30",
        single: true,
        desc: "Professional bond-building treatment: No.1 before your chemical service, No.2 to finish.",
        ideal: "Anyone colouring, lightening or perming — especially regular bleach.",
      },
      {
        name: "Kérastase Scalp Relax Spa & Serum",
        range: "£15",
        from: "£15",
        single: true,
        desc: "A Kérastase scalp spa treatment with serum, to relax the scalp.",
        ideal: "A calming treat alongside your haircut or chemical service.",
      },
    ],
  },
};

/** True for a real price, false for an empty cell ("–" or "-"). */
export function isPrice(value: string | undefined | null): value is string {
  return !!value && value !== "–" && value !== "-";
}

/** A single price row with at least two real prices (e.g. hair lengths) has something to choose. */
export function hasChoices(item: MenuItem): boolean {
  return !!item.cols && !!item.prices && !item.rows && item.prices.filter(isPrice).length >= 2;
}

/** Services in a category with barbers get the picker, as do services with several price columns. */
export function isPickable(item: MenuItem, category: MenuCategory): boolean {
  return !!category.barbers || hasChoices(item);
}

/** Label for a price column; hair lengths read "Short length", other columns are used as they are. */
export function cutLabel(cols: readonly string[], index: number): string {
  return cols.join("|") === "Short|Medium|Long" ? `${cols[index]} length` : cols[index];
}

/** The amount in pounds of a price string such as "£80" or "£100 – £220+" (its first number). */
function priceAmount(value: string): number {
  return parseInt(value.replace(/[^\d]/g, ""), 10);
}

function fromAmount(item: MenuItem): number {
  return priceAmount(item.from);
}

/** Lowest price in a column across the barbers' rows, in pounds; null when no row has a price there. */
export function minPriceForColumn(item: MenuItem, col: number): number | null {
  const amounts = (item.rows ?? [])
    .map((row) => row.prices[col])
    .filter(isPrice)
    .map(priceAmount);
  return amounts.length > 0 ? Math.min(...amounts) : null;
}

/** The category one step before (-1) or after (+1) `current`, wrapping around at either end. */
export function adjacentCategory(current: CategoryKey, step: 1 | -1): CategoryKey {
  const count = CATEGORY_ORDER.length;
  return CATEGORY_ORDER[(CATEGORY_ORDER.indexOf(current) + step + count) % count];
}

export interface CategoryStats {
  count: number;
  /** Lowest "from" price in the category, in pounds. */
  from: number;
}

export function categoryStats(category: MenuCategory): CategoryStats {
  return {
    count: category.items.length,
    from: Math.min(...category.items.map(fromAmount)),
  };
}

export const totalServices: number = CATEGORY_ORDER.reduce(
  (sum, key) => sum + MENU[key].items.length,
  0,
);

export interface PriceLabel {
  prefix?: string;
  text: string;
}

/** Price shown on a menu card: a range as is, otherwise "From" (when there are several columns) + price. */
export function priceLabel(item: MenuItem): PriceLabel {
  if (item.range) return { text: item.range };
  if (item.cols && item.cols.length > 1) return { prefix: "From", text: item.from };
  return { text: item.from };
}

/** Accessible name of a menu card. */
export function cardAriaLabel(item: MenuItem): string {
  const price = item.single ? item.range : `from ${item.from}`;
  return `${item.name}, ${price}. Open details`;
}
