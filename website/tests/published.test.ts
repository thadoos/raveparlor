import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { DEFAULT_CONTENT_V1 } from "@/lib/content/legacy-v1";

vi.mock("server-only", () => ({}));

const { parsePublishedRow } = await import("@/lib/content/published");

describe("parsePublishedRow", () => {
  it("throws for a missing row", () => {
    expect(() => parsePublishedRow(null)).toThrow("No published content");
  });

  it("throws with the issue paths for invalid content", () => {
    const content = structuredClone(DEFAULT_CONTENT) as { barbers: unknown[] };
    content.barbers = [];
    expect(() => parsePublishedRow({ content })).toThrow(/barbers/);
  });

  it("returns the content for DEFAULT_CONTENT", () => {
    expect(parsePublishedRow({ content: structuredClone(DEFAULT_CONTENT) })).toEqual(
      DEFAULT_CONTENT,
    );
  });

  it("migrates a stored v1 row to v2", () => {
    expect(parsePublishedRow({ content: structuredClone(DEFAULT_CONTENT_V1) })).toEqual(
      DEFAULT_CONTENT,
    );
  });
});
