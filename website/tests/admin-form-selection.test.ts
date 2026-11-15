import { describe, expect, it } from "vitest";
import {
  setChemicalNote,
  setHeroCaption,
  setPrice,
  setReviewStats,
  updateBarber,
} from "@/lib/admin/draft-ops";
import {
  dirtySections,
  formSelectionQuery,
  historyUpdate,
  parseFormSelection,
  selectionTarget,
  targetSelection,
} from "@/lib/admin/form-selection";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import type { SiteContent } from "@/lib/content/schema";

function content(): SiteContent {
  return structuredClone(DEFAULT_CONTENT);
}

const parse = (query: string) => parseFormSelection(new URLSearchParams(query));

describe("parseFormSelection", () => {
  it("round-trips a service selection", () => {
    const selection = parse("section=services&item=cut.cutting");
    expect(selection).toEqual({ section: "services", item: "cut.cutting" });
    expect(parse(formSelectionQuery(selection))).toEqual(selection);
  });

  it("defaults to services", () => {
    expect(parse("")).toEqual({ section: "services" });
    expect(parse("section=bogus")).toEqual({ section: "services" });
  });

  it("drops unknown items", () => {
    expect(parse("item=cut.nope")).toEqual({ section: "services" });
    expect(parse("section=services&item=nope.cutting")).toEqual({ section: "services" });
    expect(parse("section=services&item=cut")).toEqual({ section: "services" });
  });

  it("accepts a category intro", () => {
    expect(parse("section=services&item=cut.intro")).toEqual({
      section: "services",
      item: "cut.intro",
    });
  });

  it("accepts the hero and reviews sections", () => {
    expect(parse("section=hero")).toEqual({ section: "hero" });
    expect(parse("section=reviews")).toEqual({ section: "reviews" });
    expect(formSelectionQuery({ section: "reviews" })).toBe("section=reviews");
  });

  it("ignores the item outside services", () => {
    expect(parse("section=hours&item=cut.cutting")).toEqual({ section: "hours" });
  });

  it("round-trips a photo slot, and drops unknown slots or slots outside photos", () => {
    const selection = parse("section=photos&slot=priceList");
    expect(selection).toEqual({ section: "photos", slot: "priceList" });
    expect(formSelectionQuery(selection)).toBe("section=photos&slot=priceList");
    expect(parse("section=photos&slot=nope")).toEqual({ section: "photos" });
    expect(parse("section=hours&slot=priceList")).toEqual({ section: "hours" });
    expect(parse("section=photos")).toEqual({ section: "photos" });
  });
});

describe("formSelectionQuery", () => {
  it("leaves out a missing item", () => {
    expect(formSelectionQuery({ section: "photos" })).toBe("section=photos");
    expect(formSelectionQuery({ section: "services", item: "cut.intro" })).toBe(
      "section=services&item=cut.intro",
    );
  });
});

describe("selection and targets", () => {
  it("maps a selection to its editor target", () => {
    expect(selectionTarget({ section: "services", item: "cut.cutting" })).toEqual({
      kind: "item",
      category: "cut",
      item: "cutting",
    });
    expect(selectionTarget({ section: "services", item: "perm.intro" })).toEqual({
      kind: "intro",
      category: "perm",
    });
    expect(selectionTarget({ section: "services" })).toBeNull();
    expect(selectionTarget({ section: "hours" })).toEqual({ kind: "hours" });
    expect(selectionTarget({ section: "hero" })).toEqual({ kind: "hero" });
    expect(selectionTarget({ section: "reviews" })).toEqual({ kind: "reviews" });
  });

  it("maps targets to the section that edits them", () => {
    expect(targetSelection({ kind: "barbers" })).toEqual({ section: "barbers" });
    expect(targetSelection({ kind: "barber", id: "x" })).toEqual({ section: "barbers" });
    expect(targetSelection({ kind: "intro", category: "colour" })).toEqual({
      section: "services",
      item: "colour.intro",
    });
    expect(targetSelection({ kind: "itemPhoto", category: "cut", item: "updo", index: 1 })).toEqual(
      { section: "services", item: "cut.updo" },
    );
    expect(targetSelection({ kind: "chemicalNote" })).toEqual({
      section: "services",
      item: "colour.roots",
    });
    expect(targetSelection({ kind: "image", slot: "priceList" })).toEqual({
      section: "photos",
      slot: "priceList",
    });
    expect(targetSelection({ kind: "business" })).toEqual({ section: "business" });
    expect(targetSelection({ kind: "hero" })).toEqual({ section: "hero" });
    expect(targetSelection({ kind: "reviews" })).toEqual({ section: "reviews" });
  });
});

describe("dirtySections", () => {
  it("is empty when nothing changed", () => {
    expect(dirtySections(content(), content()).size).toBe(0);
  });

  it("marks the service and its section after a price change", () => {
    const saved = content();
    const draft = setPrice(saved, "cut", "cutting", saved.barbers[0].id, 0, "£99");
    expect([...dirtySections(saved, draft)].sort()).toEqual(["cut.cutting", "services"]);
  });

  it("marks barbers after a barber edit", () => {
    const saved = content();
    const draft = updateBarber(saved, saved.barbers[0].id, { days: "Sun" });
    expect([...dirtySections(saved, draft)]).toEqual(["barbers"]);
  });

  it("marks every chemical-note service when the shared note changes", () => {
    const saved = content();
    const dirty = dirtySections(saved, setChemicalNote(saved, "New note"));
    expect(dirty.has("services")).toBe(true);
    expect(dirty.has("colour.roots")).toBe(true);
    expect(dirty.has("perm.coolPerm")).toBe(true);
    expect(dirty.has("cut.cutting")).toBe(false);
  });

  it("marks hours, business and photos separately", () => {
    const saved = content();
    const draft = structuredClone(saved);
    draft.business.defaultWhatsApp = "447700900999";
    expect([...dirtySections(saved, draft)]).toEqual(["business"]);
    draft.business.hours = draft.business.hours.slice(0, 1);
    draft.images.priceList = { ...draft.images.priceList, alt: "New" };
    expect([...dirtySections(saved, draft)].sort()).toEqual(["business", "hours", "photos"]);
  });
});

describe("dirtySections for hero and reviews", () => {
  it("marks hero only when the captions differ", () => {
    const saved = content();
    const draft = setHeroCaption(saved, "left", { title: "New title" });
    expect([...dirtySections(saved, draft)]).toEqual(["hero"]);
  });

  it("marks reviews only when the reviews differ", () => {
    const saved = content();
    const draft = setReviewStats(saved, { count: 300 });
    expect([...dirtySections(saved, draft)]).toEqual(["reviews"]);
  });
});

describe("historyUpdate", () => {
  const list = { section: "services" } as const;
  const cutting = { section: "services", item: "cut.cutting" } as const;
  const updo = { section: "services", item: "cut.updo" } as const;

  it("does nothing when the selection is unchanged", () => {
    expect(historyUpdate(cutting, cutting, true)).toEqual({ mode: "none", fromList: true });
  });

  it("pushes a section change", () => {
    expect(historyUpdate(list, { section: "hours" }, false)).toEqual({
      mode: "push",
      fromList: false,
    });
    expect(historyUpdate(cutting, { section: "barbers" }, true)).toEqual({
      mode: "push",
      fromList: false,
    });
    expect(historyUpdate({ section: "photos" }, cutting, false)).toEqual({
      mode: "push",
      fromList: false,
    });
  });

  it("pushes opening an entry from the list, marking the list behind it", () => {
    expect(historyUpdate(list, cutting, false)).toEqual({ mode: "push", fromList: true });
  });

  it("replaces moving between entries, keeping the list mark", () => {
    expect(historyUpdate(cutting, updo, true)).toEqual({ mode: "replace", fromList: true });
    expect(historyUpdate(cutting, updo, false)).toEqual({ mode: "replace", fromList: false });
  });

  it("replaces going back to the list", () => {
    expect(historyUpdate(cutting, list, true)).toEqual({ mode: "replace", fromList: false });
  });
});
