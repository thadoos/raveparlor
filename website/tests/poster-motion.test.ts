import { describe, expect, it } from "vitest";
import {
  DESKTOP_TRACK_RATIO,
  PHONE_TRACK_RATIO,
  isUsableBox,
  posterScale,
  posterStartFrame,
  revealAllClip,
} from "@/lib/poster-motion";

describe("posterScale", () => {
  it("scales the view down to the thumbnail on wide screens", () => {
    const thumb = { left: 100, top: 50, width: 600, height: 424 };
    const view = { left: 24, top: 64, width: 1200, height: 849 };
    expect(posterScale(thumb, view, DESKTOP_TRACK_RATIO)).toBeCloseTo(0.5);
  });

  it("scales the whole track, not the view, to the thumbnail on phones", () => {
    const thumb = { left: 16, top: 200, width: 358, height: 253 };
    const view = { left: 0, top: 64, width: 390, height: 484 };
    const scale = posterScale(thumb, view, PHONE_TRACK_RATIO);
    expect(scale).toBeCloseTo(358 / (390 * 1.7544));
    expect(view.width * PHONE_TRACK_RATIO * scale).toBeCloseTo(thumb.width);
  });
});

describe("revealAllClip", () => {
  it("is null when the view already shows the whole track", () => {
    expect(revealAllClip(DESKTOP_TRACK_RATIO)).toBeNull();
  });

  it("extends the clip past the view's right edge by the hidden part of the track", () => {
    expect(revealAllClip(PHONE_TRACK_RATIO)).toBe("inset(0 -75.44% 0 0)");
  });
});

describe("posterStartFrame", () => {
  it("translates and uniformly scales on wide screens, with no clip", () => {
    const thumb = { left: 100, top: 50, width: 600, height: 424 };
    const view = { left: 24, top: 64, width: 1200, height: 849 };
    expect(posterStartFrame(thumb, view, DESKTOP_TRACK_RATIO)).toEqual({
      transform: "translate(76px,-14px) scale(0.5)",
      clipPath: null,
    });
  });

  it("also reveals the whole track on phones", () => {
    const thumb = { left: 16, top: 200, width: 350.88, height: 248 };
    const view = { left: 0, top: 64, width: 200, height: 248 };
    const frame = posterStartFrame(thumb, view, PHONE_TRACK_RATIO);
    const match = /^translate\(16px,136px\) scale\((.+)\)$/.exec(frame.transform);
    expect(match).not.toBeNull();
    expect(Number(match?.[1])).toBeCloseTo(1);
    expect(frame.clipPath).toBe("inset(0 -75.44% 0 0)");
  });
});

describe("isUsableBox", () => {
  it("accepts a box with a real size", () => {
    expect(isUsableBox({ left: 0, top: 0, width: 10, height: 5 })).toBe(true);
  });

  it("rejects missing and zero-size boxes", () => {
    expect(isUsableBox(null)).toBe(false);
    expect(isUsableBox(undefined)).toBe(false);
    expect(isUsableBox({ left: 0, top: 0, width: 0, height: 5 })).toBe(false);
    expect(isUsableBox({ left: 0, top: 0, width: 10, height: 0 })).toBe(false);
  });

  it("rejects non-finite numbers", () => {
    expect(isUsableBox({ left: Number.NaN, top: 0, width: 10, height: 5 })).toBe(false);
    expect(isUsableBox({ left: 0, top: 0, width: Number.POSITIVE_INFINITY, height: 5 })).toBe(
      false,
    );
  });
});
