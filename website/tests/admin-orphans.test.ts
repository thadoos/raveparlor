import { describe, expect, it } from "vitest";
import { MIN_ORPHAN_AGE_MS, findOrphans } from "@/lib/admin/orphans";
import { setImage } from "@/lib/admin/draft-ops";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";

const ref = (path: string) => ({ path, alt: "", width: 10, height: 10 });

const NOW = new Date("2026-11-14T12:00:00Z");
const OLD = new Date(NOW.getTime() - MIN_ORPHAN_AGE_MS - 1).toISOString();
const YOUNG = new Date(NOW.getTime() - 60_000).toISOString();
const obj = (path: string, createdAt = OLD) => ({ path, createdAt });

describe("findOrphans", () => {
  it("returns old storage objects no content references", () => {
    const draft = setImage(DEFAULT_CONTENT, "heroLeft", ref("heroLeft/a.webp"));
    const version = setImage(DEFAULT_CONTENT, "parlor", ref("parlor/c.webp"));
    expect(
      findOrphans(
        [obj("heroLeft/a.webp"), obj("heroLeft/b.webp"), obj("parlor/c.webp")],
        [draft, version],
        { now: NOW },
      ),
    ).toEqual(["heroLeft/b.webp"]);
  });

  it("keeps unreferenced objects younger than the minimum age", () => {
    expect(findOrphans([obj("heroLeft/new.webp", YOUNG)], [DEFAULT_CONTENT], { now: NOW })).toEqual(
      [],
    );
  });

  it("keeps objects whose age is unknown", () => {
    expect(findOrphans([obj("heroLeft/x.webp", "")], [DEFAULT_CONTENT], { now: NOW })).toEqual([]);
  });

  it("honours a custom minimum age", () => {
    expect(
      findOrphans([obj("heroLeft/new.webp", YOUNG)], [DEFAULT_CONTENT], { now: NOW, minAgeMs: 0 }),
    ).toEqual(["heroLeft/new.webp"]);
  });

  it("never returns referenced objects, old or young", () => {
    const draft = setImage(DEFAULT_CONTENT, "heroLeft", ref("heroLeft/a.webp"));
    const published = setImage(DEFAULT_CONTENT, "split", ref("split/b.webp"));
    expect(
      findOrphans([obj("heroLeft/a.webp"), obj("split/b.webp", YOUNG)], [draft, published], {
        now: NOW,
      }),
    ).toEqual([]);
  });

  it("does not let bundled /images paths protect anything", () => {
    expect(findOrphans([obj("images/parlor-reception.jpg")], [DEFAULT_CONTENT], { now: NOW })).toEqual(
      ["images/parlor-reception.jpg"],
    );
  });

  it("handles an empty bucket", () => {
    expect(findOrphans([], [DEFAULT_CONTENT], { now: NOW })).toEqual([]);
  });
});
