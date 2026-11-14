import { describe, expect, it } from "vitest";
import { parseTargetKey, targetKey, targetLabel } from "@/lib/admin/targets";
import type { EditTarget } from "@/lib/admin/targets";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { CATEGORY_KEYS, IMAGE_SLOTS } from "@/lib/content/schema";
import { MENU_STRUCTURE } from "@/lib/content/structure";

const ALL_TARGETS: EditTarget[] = [
  { kind: "barbers" },
  ...DEFAULT_CONTENT.barbers.map((b): EditTarget => ({ kind: "barber", id: b.id })),
  ...CATEGORY_KEYS.flatMap((category): EditTarget[] => [
    { kind: "intro", category },
    ...MENU_STRUCTURE[category].items.map((item): EditTarget => ({
      kind: "item",
      category,
      item: item.key,
    })),
  ]),
  { kind: "hours" },
  { kind: "business" },
  { kind: "chemicalNote" },
  ...IMAGE_SLOTS.map((slot): EditTarget => ({ kind: "image", slot })),
];

describe("edit targets", () => {
  it("round-trips every target through targetKey and parseTargetKey", () => {
    for (const target of ALL_TARGETS) {
      expect(parseTargetKey(targetKey(target))).toEqual(target);
    }
  });

  it("uses readable keys", () => {
    expect(targetKey({ kind: "item", category: "colour", item: "roots" })).toBe(
      "item:colour.roots",
    );
    expect(targetKey({ kind: "image", slot: "heroLeft" })).toBe("image:heroLeft");
    expect(targetKey({ kind: "barber", id: "abc" })).toBe("barber:abc");
  });

  it("rejects unknown kinds, categories, items and slots", () => {
    expect(parseTargetKey("item:colour.nope")).toBeNull();
    expect(parseTargetKey("item:nope.roots")).toBeNull();
    expect(parseTargetKey("intro:nope")).toBeNull();
    expect(parseTargetKey("image:nope")).toBeNull();
    expect(parseTargetKey("bogus")).toBeNull();
    expect(parseTargetKey("barber:")).toBeNull();
    expect(parseTargetKey("hours:extra")).toBeNull();
  });

  it("labels targets for the editor header", () => {
    expect(targetLabel({ kind: "item", category: "colour", item: "roots" }, DEFAULT_CONTENT)).toBe(
      "Root Retouching",
    );
    const [first] = DEFAULT_CONTENT.barbers;
    expect(targetLabel({ kind: "barber", id: first.id }, DEFAULT_CONTENT)).toBe(first.name);
    expect(targetLabel({ kind: "hours" }, DEFAULT_CONTENT)).toBe("Opening hours");
  });
});
