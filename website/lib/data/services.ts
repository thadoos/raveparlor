import type { CategoryKey } from "@/lib/content/schema";
import type { ResolvedImage } from "@/lib/content/view";

/** Service menu types and helpers (the menu itself is built from the content document). */

export type { CategoryKey } from "@/lib/content/schema";

export type { Barber } from "@/lib/content/schema";

export interface PriceRow {
  /** The barber's name; "" for the single row of an item without a barber axis. */
  label: string;
  /** The barber's days; "" without a barber. */
  sub: string;
  /** One cell per option (one cell when the item has no options). "–" means "not offered". */
  prices: readonly string[];
  /** Id of the barber this row belongs to; null without a barber axis. */
  barberId: string | null;
}

export interface MenuItem {
  /** Stable key of the service within its category. */
  key: string;
  name: string;
  /** Option labels, the price columns (e.g. hair lengths); empty for a single price per row. */
  options: readonly string[];
  /** True when prices depend on the barber: one row per barber and a barber choice. */
  byBarber: boolean;
  /** Price rows: one per barber when `byBarber`, else a single row. */
  rows: readonly PriceRow[];
  /** True when `byBarber` and every barber's row is identical: the details show one row. */
  collapsed: boolean;
  /** Lowest price, e.g. "£30". */
  from: string;
  single?: boolean;
  desc: string;
  ideal: string;
  note?: string;
  /** The 1-2 photos shown in the service's dialog. */
  photos: readonly ResolvedImage[];
}

export interface MenuCategory {
  name: string;
  media: ResolvedImage;
  intro: readonly string[];
  items: readonly MenuItem[];
}

export const CATEGORY_ORDER: readonly CategoryKey[] = ["cut", "colour", "perm", "treat"];

/** True for a real price, false for an empty cell ("–" or "-"). */
export function isPrice(value: string | undefined | null): value is string {
  return !!value && value !== "–" && value !== "-";
}

/** The rows the details view shows: one row when the barbers' rows are collapsed. */
export function displayedRows(item: MenuItem): readonly PriceRow[] {
  return item.collapsed ? item.rows.slice(0, 1) : item.rows;
}

/** Something to choose before booking: a barber, or one of two or more priced options. */
export function isPickable(item: MenuItem): boolean {
  if (item.byBarber) return true;
  const real = (item.rows.at(0)?.prices ?? []).filter(isPrice).length;
  return real >= 2 && item.options.length >= 2;
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

/** Lowest price in a column across the rows, in pounds; null when no row has a price there. */
export function minPriceForColumn(item: MenuItem, col: number): number | null {
  const amounts = item.rows
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

/**
 * Price shown on a menu card: a single displayed cell exactly as written (e.g. "£30 – £40"),
 * otherwise "From" + the lowest price. Cells count by their text, "–" included.
 */
export function priceLabel(item: MenuItem): PriceLabel {
  const cells = new Set(displayedRows(item).flatMap((row) => row.prices));
  if (cells.size === 1) return { text: [...cells][0] };
  return { prefix: "From", text: item.from };
}

/** Accessible name of a menu card. */
export function cardAriaLabel(item: MenuItem): string {
  const price = item.single ? priceLabel(item).text : `from ${item.from}`;
  return `${item.name}, ${price}. Open details`;
}
