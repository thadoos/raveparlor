import { describe, expect, it } from "vitest";
import { fitWithin } from "@/lib/admin/image-resize";

describe("fitWithin", () => {
  it("scales a wide image down to the max edge", () => {
    expect(fitWithin(4800, 3200)).toEqual({ width: 2400, height: 1600 });
  });

  it("scales a tall image down to the max edge", () => {
    expect(fitWithin(1000, 3000)).toEqual({ width: 800, height: 2400 });
  });

  it("never upscales", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("rounds and honours a custom max edge", () => {
    expect(fitWithin(1000, 333, 500)).toEqual({ width: 500, height: 167 });
  });
});
