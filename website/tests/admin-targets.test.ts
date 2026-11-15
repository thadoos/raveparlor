import { describe, expect, it } from "vitest";
import { IMAGE_GROUPS, parseTargetKey, targetKey, targetLabel } from "@/lib/admin/targets";
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
    ...MENU_STRUCTURE[category].items.map((item): EditTarget => ({
      kind: "item",
      category,
      item: item.key,
      focus: "pricing",
    })),
    ...MENU_STRUCTURE[category].items.flatMap((item) =>
      ([0, 1] as const).map((index): EditTarget => ({
        kind: "itemPhoto",
        category,
        item: item.key,
        index,
      })),
    ),
  ]),
  { kind: "hours" },
  { kind: "business" },
  { kind: "chemicalNote" },
  { kind: "hero" },
  { kind: "reviews" },
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
    expect(targetKey({ kind: "item", category: "colour", item: "roots", focus: "pricing" })).toBe(
      "item:colour.roots#pricing",
    );
    expect(targetKey({ kind: "image", slot: "heroLeft" })).toBe("image:heroLeft");
    expect(targetKey({ kind: "barber", id: "abc" })).toBe("barber:abc");
    expect(targetKey({ kind: "hero" })).toBe("hero");
    expect(targetKey({ kind: "reviews" })).toBe("reviews");
    expect(targetKey({ kind: "itemPhoto", category: "cut", item: "cutting", index: 1 })).toBe(
      "itemPhoto:cut.cutting.1",
    );
  });

  it("rejects unknown kinds, categories, items and slots", () => {
    expect(parseTargetKey("item:colour.nope")).toBeNull();
    expect(parseTargetKey("item:colour.roots#foo")).toBeNull();
    expect(parseTargetKey("item:colour.roots#")).toBeNull();
    expect(parseTargetKey("item:colour.nope#pricing")).toBeNull();
    expect(parseTargetKey("item:nope.roots")).toBeNull();
    expect(parseTargetKey("intro:nope")).toBeNull();
    expect(parseTargetKey("image:nope")).toBeNull();
    expect(parseTargetKey("bogus")).toBeNull();
    expect(parseTargetKey("barber:")).toBeNull();
    expect(parseTargetKey("hours:extra")).toBeNull();
    expect(parseTargetKey("hero:x")).toBeNull();
    expect(parseTargetKey("reviews:x")).toBeNull();
    expect(parseTargetKey("itemPhoto:cut.cutting.2")).toBeNull();
    expect(parseTargetKey("itemPhoto:cut.cutting.01")).toBeNull();
    expect(parseTargetKey("itemPhoto:cut.cutting")).toBeNull();
    expect(parseTargetKey("itemPhoto:cut.nope.0")).toBeNull();
    expect(parseTargetKey("itemPhoto:nope.cutting.0")).toBeNull();
    expect(parseTargetKey("itemPhoto:cut.cutting.0.0")).toBeNull();
  });

  it("labels targets for the editor header", () => {
    expect(targetLabel({ kind: "item", category: "colour", item: "roots" }, DEFAULT_CONTENT)).toBe(
      "Root Retouching",
    );
    const [first] = DEFAULT_CONTENT.barbers;
    expect(targetLabel({ kind: "barber", id: first.id }, DEFAULT_CONTENT)).toBe(first.name);
    expect(targetLabel({ kind: "hours" }, DEFAULT_CONTENT)).toBe("Opening hours");
    expect(targetLabel({ kind: "hero" }, DEFAULT_CONTENT)).toBe("Hero captions");
    expect(targetLabel({ kind: "reviews" }, DEFAULT_CONTENT)).toBe("Reviews");
    expect(
      targetLabel({ kind: "itemPhoto", category: "cut", item: "updo", index: 1 }, DEFAULT_CONTENT),
    ).toBe("Up-do Hairdressing photo 2");
  });

  it("groups every image slot exactly once", () => {
    const slots = IMAGE_GROUPS.flatMap((group) => group.slots);
    expect([...slots].sort()).toEqual([...IMAGE_SLOTS].sort());
    expect(IMAGE_GROUPS.map((group) => group.title)).not.toContain("Service dialog photos");
  });
});
