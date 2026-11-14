import { describe, expect, it } from "vitest";
import { setChemicalNote, setPrice, updateBarber } from "@/lib/admin/draft-ops";
import {
  dirtySections,
  formSelectionQuery,
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

  it("ignores the item outside services", () => {
    expect(parse("section=hours&item=cut.cutting")).toEqual({ section: "hours" });
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
    expect(targetSelection({ kind: "image", slot: "priceList" })).toEqual({ section: "photos" });
    expect(targetSelection({ kind: "business" })).toEqual({ section: "business" });
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
