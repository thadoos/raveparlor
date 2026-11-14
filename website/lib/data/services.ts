import type { Barber, CategoryKey } from "@/lib/content/schema";
import type { ResolvedImage } from "@/lib/content/view";

/** Service menu types and helpers (the menu itself is built from the content document). */

export type { CategoryKey } from "@/lib/content/schema";

export type { Barber } from "@/lib/content/schema";

export interface PriceRow {
  label: string;
  sub: string;
  prices: readonly string[];
  /** Id of the barber this row belongs to. */
  barberId?: string;
}

export interface MenuItem {
  /** Stable key of the service within its category. */
  key: string;
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
  images: readonly ResolvedImage[];
  media: ResolvedImage;
  /** Present when prices depend on the barber. */
  barbers?: readonly Barber[];
  intro: readonly string[];
  items: readonly MenuItem[];
}

export const CATEGORY_ORDER: readonly CategoryKey[] = ["cut", "colour", "perm", "treat"];

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
