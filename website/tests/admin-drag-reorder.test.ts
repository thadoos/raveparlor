import { describe, expect, it } from "vitest";
import { dragOffsets, dragTargetIndex } from "@/lib/admin/drag-reorder";

const EVEN = [60, 60, 60, 60];

describe("dragTargetIndex", () => {
  it("stays put for small moves", () => {
    expect(dragTargetIndex(1, 0, EVEN)).toBe(1);
    expect(dragTargetIndex(1, 29, EVEN)).toBe(1);
    expect(dragTargetIndex(1, -29, EVEN)).toBe(1);
  });

  it("moves down once the dragged row passes the next row's middle", () => {
    expect(dragTargetIndex(0, 31, EVEN)).toBe(1);
    expect(dragTargetIndex(0, 91, EVEN)).toBe(2);
  });

  it("moves up once the dragged row passes the previous row's middle", () => {
    expect(dragTargetIndex(3, -31, EVEN)).toBe(2);
    expect(dragTargetIndex(3, -151, EVEN)).toBe(0);
  });

  it("clamps at the ends", () => {
    expect(dragTargetIndex(0, -500, EVEN)).toBe(0);
    expect(dragTargetIndex(2, 5000, EVEN)).toBe(3);
  });

  it("handles rows of different heights", () => {
    // Rows: 0-40, 40-140, 140-180. Row 0's bottom edge (40) must pass row 1's centre (90).
    expect(dragTargetIndex(0, 49, [40, 100, 40])).toBe(0);
    expect(dragTargetIndex(0, 51, [40, 100, 40])).toBe(1);
  });
});

describe("dragOffsets", () => {
  it("follows the finger with the dragged row and shifts the rows it passes", () => {
    expect(dragOffsets(0, 2, 100, EVEN)).toEqual([100, -60, -60, 0]);
    expect(dragOffsets(3, 1, -100, EVEN)).toEqual([0, 60, 60, -100]);
    expect(dragOffsets(1, 1, 10, EVEN)).toEqual([0, 10, 0, 0]);
  });
});
