import { describe, expect, it } from "vitest";
import {
  addBarber,
  clearItemNote,
  moveBarber,
  removeBarber,
  setChemicalNote,
  setDefaultWhatsApp,
  setHours,
  setImage,
  setImageAlt,
  setIntro,
  setItemContent,
  updateBarber,
} from "@/lib/admin/draft-ops";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import type { SiteContent } from "@/lib/content/schema";

const [RAVE, JOHN, JULIAN] = DEFAULT_CONTENT.barbers;
const NEW_ID = "0e4c3f85-6d71-4f40-8d9e-4a5b6c7d8e94";

function content(): SiteContent {
  return structuredClone(DEFAULT_CONTENT);
}

describe("draft operations", () => {
  it("removeBarber drops only that id", () => {
    const next = removeBarber(content(), JOHN.id);
    expect(next.barbers.map((b) => b.id)).toEqual([RAVE.id, JULIAN.id]);
  });

  it("moveBarber puts Julian first", () => {
    const next = moveBarber(content(), JULIAN.id, 0);
    expect(next.barbers.map((b) => b.name)).toEqual(["Julian", "Rave", "John"]);
  });

  it("moveBarber clamps the target index", () => {
    const next = moveBarber(content(), RAVE.id, 99);
    expect(next.barbers.map((b) => b.name)).toEqual(["John", "Julian", "Rave"]);
  });

  it("addBarber appends with the given id", () => {
    const next = addBarber(
      content(),
      { name: "Mia", days: "Mon", whatsApp: "447700900123", cutPrices: ["£50", "£70", "£30"] },
      NEW_ID,
    );
    expect(next.barbers).toHaveLength(4);
    expect(next.barbers[3]).toEqual({
      id: NEW_ID,
      name: "Mia",
      days: "Mon",
      whatsApp: "447700900123",
      cutPrices: ["£50", "£70", "£30"],
    });
  });

  it("updateBarber patches only that barber", () => {
    const next = updateBarber(content(), JOHN.id, { days: "Tue" });
    expect(next.barbers[1]).toEqual({ ...JOHN, days: "Tue" });
    expect(next.barbers[0]).toEqual(RAVE);
  });

  it("setItemContent changes only that item", () => {
    const before = content();
    const next = setItemContent(before, "colour", "roots", { prices: ["£85", "–", "–"] });
    expect(next.services.colour.items.roots).toEqual({
      ...before.services.colour.items.roots,
      prices: ["£85", "–", "–"],
    });
    const expected = structuredClone(before);
    expected.services.colour.items.roots.prices = ["£85", "–", "–"];
    expect(next).toEqual(expected);
  });

  it("setIntro, setHours, setDefaultWhatsApp, setChemicalNote, setImage and setImageAlt set their field", () => {
    const c = content();
    expect(setIntro(c, "perm", 1, "New").services.perm.intro).toEqual([
      c.services.perm.intro[0],
      "New",
    ]);
    expect(setHours(c, [c.business.hours[0]]).business.hours).toEqual([c.business.hours[0]]);
    expect(setDefaultWhatsApp(c, "447700900123").business.defaultWhatsApp).toBe("447700900123");
    expect(setChemicalNote(c, "Note").sharedNotes.chemical).toBe("Note");
    const ref = { path: "a/b.webp", alt: "Alt", width: 10, height: 20 };
    expect(setImage(c, "heroLeft", ref).images.heroLeft).toEqual(ref);
    expect(setImageAlt(c, "split", "New alt").images.split).toEqual({
      ...c.images.split,
      alt: "New alt",
    });
  });

  it("never mutates the input", () => {
    const ops: ((c: SiteContent) => SiteContent)[] = [
      (c) =>
        addBarber(
          c,
          { name: "Mia", days: "Mon", whatsApp: "447700900123", cutPrices: ["£1", "£2", "£3"] },
          NEW_ID,
        ),
      (c) => removeBarber(c, JOHN.id),
      (c) => moveBarber(c, JULIAN.id, 0),
      (c) => updateBarber(c, RAVE.id, { cutPrices: ["£60", "£80", "£35"] }),
      (c) => setItemContent(c, "colour", "roots", { prices: ["£85", "–", "–"] }),
      (c) => setIntro(c, "cut", 0, "Hi"),
      (c) => setHours(c, []),
      (c) => setDefaultWhatsApp(c, "447700900123"),
      (c) => setChemicalNote(c, "x"),
      (c) => setImage(c, "heroLeft", { path: "x", alt: "", width: 1, height: 1 }),
      (c) => setImageAlt(c, "heroLeft", "x"),
    ];
    for (const op of ops) {
      const input = content();
      const snapshot = structuredClone(input);
      op(input);
      expect(input).toEqual(snapshot);
    }
  });

  it("clearItemNote removes the note key and leaves other items alone", () => {
    const before = content();
    const next = clearItemNote(before, "cut", "cleansing");
    expect(Object.hasOwn(next.services.cut.items.cleansing, "note")).toBe(false);
    expect(next.services.cut.items.cleansing.desc).toBe(before.services.cut.items.cleansing.desc);
    expect(next.services.cut.items.updo).toBe(before.services.cut.items.updo);
    expect(Object.hasOwn(before.services.cut.items.cleansing, "note")).toBe(true);
  });
});
