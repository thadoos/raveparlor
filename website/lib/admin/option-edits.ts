import type { ItemContent } from "@/lib/content/schema";

/**
 * The options editor's edits, as the (options, mapping) pairs setOptions takes. `mapping[i]` is the
 * old price cell that new cell `i` keeps, or null for a new, not-offered cell. An item without
 * options has one cell, so going from no options to one (or from one to none) keeps that price.
 */

export interface OptionEdit {
  options: string[];
  mapping: (number | null)[];
}

const NOT_OFFERED = "–";

/** Every cell kept in place: [0 .. n-1], or [0] for no options. */
function identity(count: number): number[] {
  return Array.from({ length: Math.max(1, count) }, (_, i) => i);
}

export function renameOption(options: readonly string[], index: number, label: string): OptionEdit {
  return {
    options: options.map((option, i) => (i === index ? label : option)),
    mapping: identity(options.length),
  };
}

/** Appends an option. Its cells start not offered, except the first option takes the item's
 *  single price. */
export function addOption(options: readonly string[], label: string): OptionEdit {
  return {
    options: [...options, label],
    mapping: options.length === 0 ? [0] : [...identity(options.length), null],
  };
}

/** Drops an option and its cells. Removing the last option keeps its price as the item's price. */
export function removeOption(options: readonly string[], index: number): OptionEdit {
  return {
    options: options.filter((_, i) => i !== index),
    mapping: options.length <= 1 ? [0] : identity(options.length).filter((i) => i !== index),
  };
}

/** Moves an option, and its cells, to `to` (clamped to the list). */
export function moveOption(options: readonly string[], index: number, to: number): OptionEdit {
  const order = identity(options.length).slice(0, options.length);
  const target = Math.max(0, Math.min(to, options.length - 1));
  const [moved] = order.splice(index, 1);
  order.splice(target, 0, moved);
  return {
    options: order.map((i) => options[i]),
    mapping: options.length === 0 ? [0] : order,
  };
}

/**
 * Why `label` can't be the option at `index` (or a new option, when index is undefined), or null
 * when it can. Mirrors setOptions: labels are trimmed, required and unique ignoring case.
 */
export function optionLabelError(
  options: readonly string[],
  label: string,
  index?: number,
): string | null {
  const folded = label.trim().toLowerCase();
  if (folded === "") return "Enter a name for the option.";
  const clash = options.find((option, i) => i !== index && option.trim().toLowerCase() === folded);
  return clash === undefined ? null : `There is already an option called "${clash}".`;
}

/** Whether removing option `index` would throw away a real price in any row. */
export function optionHasPrice(item: ItemContent, index: number): boolean {
  if (item.options.length <= 1) return false;
  const rows = [
    ...(item.prices.base ? [item.prices.base] : []),
    ...Object.values(item.prices.barbers ?? {}),
  ];
  return rows.some((row) => row[index] !== undefined && row[index] !== NOT_OFFERED);
}
