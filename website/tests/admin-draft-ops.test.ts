import { describe, expect, it } from "vitest";
import {
  addBarber,
  addItemPhoto,
  applyRowToAllBarbers,
  clearItemNote,
  moveBarber,
  removeBarber,
  removeItemPhoto,
  setByBarber,
  setChemicalNote,
  setDefaultWhatsApp,
  setHours,
  setImage,
  setImageAlt,
  setIntro,
  setItemContent,
  setItemPhoto,
  setItemPhotoAlt,
  setOptions,
  setPrice,
  updateBarber,
} from "@/lib/admin/draft-ops";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { parseSiteContent } from "@/lib/content/schema";
import type { ImageRef, SiteContent } from "@/lib/content/schema";

const [RAVE, JOHN, JULIAN] = DEFAULT_CONTENT.barbers;
const NEW_ID = "0e4c3f85-6d71-4f40-8d9e-4a5b6c7d8e94";
const MIA = { name: "Mia", days: "Mon", whatsApp: "447700900123" };
const BARBER_ITEMS = ["cutting", "cleansing", "updo"] as const;
const PHOTO: ImageRef = {
  path: "item.cut.cutting/0e4c3f85-6d71-4f40-8d9e-4a5b6c7d8e94.webp",
  alt: "A new photo",
  width: 800,
  height: 1000,
};

function content(): SiteContent {
  return structuredClone(DEFAULT_CONTENT);
}

function expectValid(c: SiteContent) {
  const result = parseSiteContent(c);
  expect(result.ok ? [] : result.issues).toEqual([]);
}

/** Every barber row of a cut item. */
function rows(c: SiteContent, item: (typeof BARBER_ITEMS)[number]) {
  return c.services.cut.items[item].prices.barbers ?? {};
}

describe("barber operations", () => {
  it("removeBarber drops only that id", () => {
    const next = removeBarber(content(), JOHN.id);
    expect(next.barbers.map((b) => b.id)).toEqual([RAVE.id, JULIAN.id]);
  });

  it("removeBarber removes the barber's row from every byBarber item, and the result parses", () => {
    const next = removeBarber(content(), JOHN.id);
    for (const item of BARBER_ITEMS) {
      expect(Object.keys(rows(next, item))).toEqual([RAVE.id, JULIAN.id]);
    }
    expect(next.services.colour.items.roots).toEqual(DEFAULT_CONTENT.services.colour.items.roots);
    expectValid(next);
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
    const next = addBarber(content(), MIA, NEW_ID);
    expect(next.barbers).toHaveLength(4);
    expect(next.barbers[3]).toEqual({ id: NEW_ID, ...MIA });
  });

  it("addBarber gives the new barber a copy of the first barber's row in every byBarber item", () => {
    const before = content();
    const next = addBarber(before, MIA, NEW_ID);
    for (const item of BARBER_ITEMS) {
      expect(rows(next, item)[NEW_ID]).toEqual(rows(before, item)[RAVE.id]);
      expect(rows(next, item)[NEW_ID]).not.toBe(rows(next, item)[RAVE.id]);
    }
    expect(next.services.colour.items.roots.prices).toEqual({ base: ["£80", "–", "–"] });
    expectValid(next);
  });

  it("updateBarber patches only that barber", () => {
    const next = updateBarber(content(), JOHN.id, { days: "Tue" });
    expect(next.barbers[1]).toEqual({ ...JOHN, days: "Tue" });
    expect(next.barbers[0]).toEqual(RAVE);
  });
});

describe("setOptions", () => {
  it("removes an option and its cells from every row", () => {
    const before = content();
    const next = setOptions(before, "cut", "cutting", ["Gentleman", "Under 12s"], [0, 2]);
    const item = next.services.cut.items.cutting;
    expect(item.options).toEqual(["Gentleman", "Under 12s"]);
    for (const [id, row] of Object.entries(rows(before, "cutting"))) {
      expect(item.prices.barbers?.[id]).toEqual([row[0], row[2]]);
    }
    expectValid(next);
  });

  it("reorders the cells with their labels", () => {
    const before = content();
    const next = setOptions(
      before,
      "cut",
      "cutting",
      ["Under 12s", "Gentleman", "Ladies"],
      [2, 0, 1],
    );
    for (const [id, [gent, ladies, u12]] of Object.entries(rows(before, "cutting"))) {
      expect(next.services.cut.items.cutting.prices.barbers?.[id]).toEqual([u12, gent, ladies]);
    }
    expectValid(next);
  });

  it("appends a not-offered cell to every row for a new option", () => {
    const before = content();
    const options = ["Gentleman", "Ladies", "Under 12s", "Teens"];
    const next = setOptions(before, "cut", "cutting", options, [0, 1, 2, null]);
    for (const [id, row] of Object.entries(rows(before, "cutting"))) {
      expect(next.services.cut.items.cutting.prices.barbers?.[id]).toEqual([...row, "–"]);
    }
    expectValid(next);
  });

  it("remaps the base row of an item without a barber axis", () => {
    const next = setOptions(content(), "colour", "fullColour", ["Long", "Short"], [2, 0]);
    expect(next.services.colour.items.fullColour.prices).toEqual({ base: ["£120", "£80"] });
    expectValid(next);
  });

  it("renames an option, trimming the label", () => {
    const next = setOptions(
      content(),
      "colour",
      "roots",
      ["  Short hair ", "Medium", "Long"],
      [0, 1, 2],
    );
    expect(next.services.colour.items.roots.options).toEqual(["Short hair", "Medium", "Long"]);
    expect(next.services.colour.items.roots.prices).toEqual({ base: ["£80", "–", "–"] });
  });

  it("accepts a rename that only changes case", () => {
    const next = setOptions(
      content(),
      "cut",
      "cutting",
      ["gentleman", "Ladies", "Under 12s"],
      [0, 1, 2],
    );
    expect(next.services.cut.items.cutting.options).toEqual(["gentleman", "Ladies", "Under 12s"]);
    expectValid(next);
  });

  it("maps the single cell of an item without options", () => {
    const added = setOptions(content(), "colour", "bleach", ["Short", "Long"], [0, null]);
    expect(added.services.colour.items.bleach.prices).toEqual({ base: ["£70 – £100", "–"] });
    expectValid(added);

    const removed = setOptions(added, "colour", "bleach", [], [0]);
    expect(removed.services.colour.items.bleach.options).toEqual([]);
    expect(removed.services.colour.items.bleach.prices).toEqual({ base: ["£70 – £100"] });
    expectValid(removed);
  });

  it("rejects duplicate, blank and badly mapped options by returning the input", () => {
    const c = content();
    const reject = (options: string[], mapping: (number | null)[]) =>
      expect(setOptions(c, "cut", "cutting", options, mapping)).toBe(c);
    reject(["Gentleman", " gentleman ", "Under 12s"], [0, 1, 2]);
    reject(["Gentleman", "  ", "Under 12s"], [0, 1, 2]);
    reject(["Gentleman", "Ladies"], [0, 1, 2]);
    reject(["Gentleman", "Ladies", "Under 12s"], [0, 0, 2]);
    reject(["Gentleman", "Ladies", "Under 12s"], [0, 1, 3]);
    reject(["Gentleman", "Ladies", "Under 12s"], [0, 1, -1]);
    reject(["Gentleman", "Ladies", "Under 12s"], [0, 1, 1.5]);
    reject([], []);
  });
});

describe("setByBarber", () => {
  it("on then off restores the base row", () => {
    const before = content();
    const on = setByBarber(before, "colour", "roots", true);
    const onItem = on.services.colour.items.roots;
    expect(onItem.byBarber).toBe(true);
    expect(Object.hasOwn(onItem.prices, "base")).toBe(false);
    expect(onItem.prices.barbers).toEqual({
      [RAVE.id]: ["£80", "–", "–"],
      [JOHN.id]: ["£80", "–", "–"],
      [JULIAN.id]: ["£80", "–", "–"],
    });
    expectValid(on);

    const off = setByBarber(on, "colour", "roots", false);
    expect(off.services.colour.items.roots).toEqual(before.services.colour.items.roots);
    expect(Object.hasOwn(off.services.colour.items.roots.prices, "barbers")).toBe(false);
    expectValid(off);
  });

  it("off then on gives every barber the same row", () => {
    const off = setByBarber(content(), "cut", "cutting", false);
    expect(off.services.cut.items.cutting.prices).toEqual({
      base: rows(DEFAULT_CONTENT, "cutting")[RAVE.id],
    });
    expectValid(off);

    const on = setByBarber(off, "cut", "cutting", true);
    const barbers = rows(on, "cutting");
    expect(Object.keys(barbers)).toEqual([RAVE.id, JOHN.id, JULIAN.id]);
    for (const row of Object.values(barbers)) expect(row).toEqual(["£55", "£80", "£35"]);
    expectValid(on);
  });

  it("returns the input when the flag already matches", () => {
    const c = content();
    expect(setByBarber(c, "cut", "cutting", true)).toBe(c);
    expect(setByBarber(c, "colour", "roots", false)).toBe(c);
  });
});

describe("setPrice and applyRowToAllBarbers", () => {
  it("sets a barber's cell", () => {
    const next = setPrice(content(), "cut", "cutting", JOHN.id, 1, "£65");
    expect(rows(next, "cutting")[JOHN.id]).toEqual(["£45", "£65", "£30"]);
    expect(rows(next, "cutting")[RAVE.id]).toEqual(["£55", "£80", "£35"]);
    expectValid(next);
  });

  it("sets a base cell", () => {
    const next = setPrice(content(), "colour", "roots", null, 2, "£120");
    expect(next.services.colour.items.roots.prices).toEqual({ base: ["£80", "–", "£120"] });
    expectValid(next);
  });

  it("ignores a row that doesn't fit the item's axis, or a cell out of range", () => {
    const c = content();
    expect(setPrice(c, "cut", "cutting", null, 0, "£1")).toBe(c);
    expect(setPrice(c, "colour", "roots", JOHN.id, 0, "£1")).toBe(c);
    expect(setPrice(c, "cut", "cutting", NEW_ID, 0, "£1")).toBe(c);
    expect(setPrice(c, "cut", "cutting", JOHN.id, 3, "£1")).toBe(c);
  });

  it("applyRowToAllBarbers copies one barber's row to every barber", () => {
    const next = applyRowToAllBarbers(content(), "cut", "cutting", JOHN.id);
    for (const row of Object.values(rows(next, "cutting")))
      expect(row).toEqual(["£45", "£60", "£30"]);
    expectValid(next);
  });

  it("applyRowToAllBarbers ignores unknown barbers and items without a barber axis", () => {
    const c = content();
    expect(applyRowToAllBarbers(c, "cut", "cutting", NEW_ID)).toBe(c);
    expect(applyRowToAllBarbers(c, "colour", "roots", JOHN.id)).toBe(c);
  });
});

describe("item photos", () => {
  it("setItemPhoto replaces one photo", () => {
    const before = content();
    const next = setItemPhoto(before, "cut", "cutting", 1, PHOTO);
    expect(next.services.cut.items.cutting.photos).toEqual([
      before.services.cut.items.cutting.photos[0],
      PHOTO,
    ]);
    expect(next.services.cut.items.cleansing).toBe(before.services.cut.items.cleansing);
    expectValid(next);
  });

  it("setItemPhotoAlt changes only the alt text", () => {
    const before = content();
    const next = setItemPhotoAlt(before, "cut", "cutting", 0, "New alt");
    expect(next.services.cut.items.cutting.photos[0]).toEqual({
      ...before.services.cut.items.cutting.photos[0],
      alt: "New alt",
    });
  });

  it("removeItemPhoto removes a photo, but never the last one", () => {
    const before = content();
    const one = removeItemPhoto(before, "cut", "cutting", 0);
    expect(one.services.cut.items.cutting.photos).toEqual([
      before.services.cut.items.cutting.photos[1],
    ]);
    expectValid(one);
    expect(removeItemPhoto(one, "cut", "cutting", 0)).toBe(one);
  });

  it("addItemPhoto adds a second photo, and does nothing at two", () => {
    const one = removeItemPhoto(content(), "cut", "cutting", 1);
    const two = addItemPhoto(one, "cut", "cutting", PHOTO);
    expect(two.services.cut.items.cutting.photos).toEqual([
      one.services.cut.items.cutting.photos[0],
      PHOTO,
    ]);
    expectValid(two);
    expect(addItemPhoto(two, "cut", "cutting", PHOTO)).toBe(two);
  });

  it("photo ops ignore a missing index", () => {
    const one = removeItemPhoto(content(), "cut", "cutting", 1);
    expect(setItemPhoto(one, "cut", "cutting", 1, PHOTO)).toBe(one);
    expect(setItemPhotoAlt(one, "cut", "cutting", 1, "x")).toBe(one);
  });
});

describe("other operations", () => {
  it("setItemContent changes only that item", () => {
    const before = content();
    const next = setItemContent(before, "colour", "roots", { desc: "New description" });
    const expected = structuredClone(before);
    expected.services.colour.items.roots.desc = "New description";
    expect(next).toEqual(expected);
    expect(next.services.colour.items.fullColour).toBe(before.services.colour.items.fullColour);
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

  it("clearItemNote removes the note key and leaves other items alone", () => {
    const before = content();
    const next = clearItemNote(before, "cut", "cleansing");
    expect(Object.hasOwn(next.services.cut.items.cleansing, "note")).toBe(false);
    expect(next.services.cut.items.cleansing.desc).toBe(before.services.cut.items.cleansing.desc);
    expect(next.services.cut.items.updo).toBe(before.services.cut.items.updo);
    expect(Object.hasOwn(before.services.cut.items.cleansing, "note")).toBe(true);
  });

  it("never mutates the input", () => {
    const ops: ((c: SiteContent) => SiteContent)[] = [
      (c) => addBarber(c, MIA, NEW_ID),
      (c) => removeBarber(c, JOHN.id),
      (c) => moveBarber(c, JULIAN.id, 0),
      (c) => updateBarber(c, RAVE.id, { days: "Sun" }),
      (c) => setItemContent(c, "colour", "roots", { ideal: "x" }),
      (c) => clearItemNote(c, "cut", "cleansing"),
      (c) => setOptions(c, "cut", "cutting", ["Under 12s", "Gentleman", "New"], [2, 0, null]),
      (c) => setByBarber(c, "cut", "cutting", false),
      (c) => setByBarber(c, "colour", "roots", true),
      (c) => setPrice(c, "cut", "cutting", RAVE.id, 0, "£1"),
      (c) => setPrice(c, "colour", "roots", null, 0, "£1"),
      (c) => applyRowToAllBarbers(c, "cut", "cutting", JOHN.id),
      (c) => setItemPhoto(c, "cut", "cutting", 0, PHOTO),
      (c) => setItemPhotoAlt(c, "cut", "cutting", 0, "x"),
      (c) => removeItemPhoto(c, "cut", "cutting", 0),
      (c) => addItemPhoto(removeItemPhoto(c, "cut", "cutting", 0), "cut", "cutting", PHOTO),
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
});
