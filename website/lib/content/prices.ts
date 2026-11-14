// Type-only imports: client components use this module, so it must not pull in zod.
import type { Barber, ItemContent } from "@/lib/content/schema";

/** An item's price rows as stored, before display rules. Pure and dependency-free. */

export interface PriceRowData {
  /** The barber this row belongs to; null for the single row of an item without a barber axis. */
  barberId: string | null;
  prices: string[];
}

/** One row per barber (in barber order) when prices depend on the barber, else one base row. */
export function priceRows(item: ItemContent, barbers: readonly Barber[]): PriceRowData[] {
  if (!item.byBarber) return [{ barberId: null, prices: [...(item.prices.base ?? [])] }];
  const byId = item.prices.barbers ?? {};
  return barbers.map((barber) => ({
    barberId: barber.id,
    prices: [...(Object.hasOwn(byId, barber.id) ? byId[barber.id] : [])],
  }));
}

/** Every price cell of an item, row by row. */
export function allCells(item: ItemContent, barbers: readonly Barber[]): string[] {
  return priceRows(item, barbers).flatMap((row) => row.prices);
}

/** True when every row has the same cells as the first (so the rows can show as one). */
export function rowsIdentical(rows: readonly PriceRowData[]): boolean {
  const [first, ...rest] = rows;
  return rest.every(
    (row) =>
      row.prices.length === first.prices.length &&
      row.prices.every((price, i) => price === first.prices[i]),
  );
}
