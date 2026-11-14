import { describe, expect, it } from "vitest";
import { setOptions } from "@/lib/admin/draft-ops";
import {
  addOption,
  moveOption,
  optionHasPrice,
  optionLabelError,
  removeOption,
  renameOption,
} from "@/lib/admin/option-edits";
import type { OptionEdit } from "@/lib/admin/option-edits";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { parseSiteContent } from "@/lib/content/schema";
import type { ItemContent } from "@/lib/content/schema";

const ROOTS = DEFAULT_CONTENT.services.colour.items.roots; // Short/Medium/Long, base £80 – –
const OLAPLEX = DEFAULT_CONTENT.services.treat.items.olaplex; // no options, base £30

function applyTo(item: "roots" | "olaplex", edit: OptionEdit): ItemContent {
  const category = item === "roots" ? "colour" : "treat";
  const next = setOptions(DEFAULT_CONTENT, category, item, edit.options, edit.mapping);
  expect(next).not.toBe(DEFAULT_CONTENT);
  expect(parseSiteContent(next).ok).toBe(true);
  return next.services[category].items[item];
}

describe("option edits", () => {
  it("renames in place", () => {
    const item = applyTo("roots", renameOption(ROOTS.options, 1, "Mid"));
    expect(item.options).toEqual(["Short", "Mid", "Long"]);
    expect(item.prices.base).toEqual(["£80", "–", "–"]);
  });

  it("adds a not-offered column", () => {
    const item = applyTo("roots", addOption(ROOTS.options, "Extra long"));
    expect(item.options).toEqual(["Short", "Medium", "Long", "Extra long"]);
    expect(item.prices.base).toEqual(["£80", "–", "–", "–"]);
  });

  it("gives the first option the item's single price", () => {
    const item = applyTo("olaplex", addOption(OLAPLEX.options, "Short"));
    expect(item.options).toEqual(["Short"]);
    expect(item.prices.base).toEqual(["£30"]);
  });

  it("removes a column", () => {
    const edit = removeOption(ROOTS.options, 1);
    expect(edit).toEqual({ options: ["Short", "Long"], mapping: [0, 2] });
    expect(applyTo("roots", edit).prices.base).toEqual(["£80", "–"]);
  });

  it("keeps the price when the last option goes", () => {
    expect(removeOption(["Short"], 0)).toEqual({ options: [], mapping: [0] });
  });

  it("moves an option with its prices, clamped", () => {
    const edit = moveOption(ROOTS.options, 0, 2);
    expect(edit).toEqual({ options: ["Medium", "Long", "Short"], mapping: [1, 2, 0] });
    expect(applyTo("roots", edit).prices.base).toEqual(["–", "–", "£80"]);
    expect(moveOption(ROOTS.options, 2, 9).options).toEqual(ROOTS.options);
    expect(moveOption(ROOTS.options, 1, -1).options).toEqual(["Medium", "Short", "Long"]);
  });
});

describe("optionLabelError", () => {
  it("requires a label", () => {
    expect(optionLabelError(ROOTS.options, "  ")).toMatch(/Enter a name/);
  });

  it("rejects duplicates ignoring case and space, except the option itself", () => {
    expect(optionLabelError(ROOTS.options, " short ")).toMatch(/"Short"/);
    expect(optionLabelError(ROOTS.options, "SHORT", 0)).toBeNull();
    expect(optionLabelError(ROOTS.options, "Medium", 0)).toMatch(/"Medium"/);
    expect(optionLabelError(ROOTS.options, "Extra long")).toBeNull();
  });
});

describe("optionHasPrice", () => {
  it("finds real prices in base and barber rows", () => {
    expect(optionHasPrice(ROOTS, 0)).toBe(true);
    expect(optionHasPrice(ROOTS, 1)).toBe(false);
    expect(optionHasPrice(DEFAULT_CONTENT.services.cut.items.cutting, 2)).toBe(true);
  });

  it("is false for the last option, whose price is kept", () => {
    expect(optionHasPrice({ ...ROOTS, options: ["Short"], prices: { base: ["£80"] } }, 0)).toBe(
      false,
    );
  });
});
