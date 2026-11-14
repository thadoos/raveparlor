import { describe, expect, it } from "vitest";
import { findOrphans } from "@/lib/admin/orphans";
import { setImage } from "@/lib/admin/draft-ops";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";

const ref = (path: string) => ({ path, alt: "", width: 10, height: 10 });

describe("findOrphans", () => {
  it("returns storage paths no content references", () => {
    const draft = setImage(DEFAULT_CONTENT, "heroLeft", ref("heroLeft/a.webp"));
    const version = setImage(DEFAULT_CONTENT, "parlor", ref("parlor/c.webp"));
    expect(
      findOrphans(["heroLeft/a.webp", "heroLeft/b.webp", "parlor/c.webp"], [draft, version]),
    ).toEqual(["heroLeft/b.webp"]);
  });

  it("ignores bundled /images paths and handles an empty bucket", () => {
    expect(findOrphans([], [DEFAULT_CONTENT])).toEqual([]);
  });
});
