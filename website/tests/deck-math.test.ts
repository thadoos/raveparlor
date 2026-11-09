import { describe, expect, it } from "vitest";
import {
  canScroll,
  clampDuration,
  cosineEase,
  jumpDuration,
  keyDirection,
  scrollDuration,
  smoothVelocity,
  touchOffset,
  touchOutcome,
  wheelAction,
  type ScrollMetrics,
  type WheelState,
} from "@/lib/deck/math";

const scrolling = (over: Partial<ScrollMetrics> = {}): ScrollMetrics => ({
  scrollable: true,
  scrollTop: 100,
  clientHeight: 500,
  scrollHeight: 1000,
  ...over,
});

describe("canScroll", () => {
  it("is false for a slide that does not scroll internally", () => {
    expect(canScroll(scrolling({ scrollable: false }), 1)).toBe(false);
    expect(canScroll(scrolling({ scrollable: false }), -1)).toBe(false);
  });

  it("can scroll both ways in the middle", () => {
    expect(canScroll(scrolling(), 1)).toBe(true);
    expect(canScroll(scrolling(), -1)).toBe(true);
  });

  it("cannot scroll up at the top", () => {
    expect(canScroll(scrolling({ scrollTop: 0 }), -1)).toBe(false);
    expect(canScroll(scrolling({ scrollTop: 1 }), -1)).toBe(true);
  });

  it("treats the last pixel as the end (1px tolerance)", () => {
    expect(canScroll(scrolling({ scrollTop: 500 }), 1)).toBe(false); // exactly at the end
    expect(canScroll(scrolling({ scrollTop: 499.5 }), 1)).toBe(false); // within 1px
    expect(canScroll(scrolling({ scrollTop: 499 }), 1)).toBe(false); // exactly 1px short
    expect(canScroll(scrolling({ scrollTop: 498.9 }), 1)).toBe(true);
  });
});

describe("wheelAction", () => {
  const idle: WheelState = { quiet: false, lastWheel: 0, lastAbs: 0 };
  const wheel = (deltaY: number, now: number, busy = false, deltaMode = 0) => ({
    deltaY,
    deltaMode,
    now,
    busy,
  });
  const never = () => false;
  const always = () => true;

  it("ignores tiny deltas without touching the state", () => {
    const result = wheelAction(wheel(0.5, 10), idle, always);
    expect(result).toEqual({ kind: "ignore", state: idle });
  });

  it("lets the slide scroll natively and goes quiet", () => {
    const result = wheelAction(wheel(40, 500), idle, always);
    expect(result).toEqual({
      kind: "native",
      state: { quiet: true, lastWheel: 500, lastAbs: 40 },
    });
  });

  it("asks about inner scroll in the wheel direction", () => {
    const asked: number[] = [];
    wheelAction(wheel(-40, 500), idle, (dir) => {
      asked.push(dir);
      return false;
    });
    expect(asked).toEqual([-1]);
  });

  it("steps one slide when idle and the slide cannot scroll", () => {
    const result = wheelAction(wheel(40, 500), idle, never);
    expect(result).toEqual({
      kind: "step",
      dir: 1,
      state: { quiet: false, lastWheel: 500, lastAbs: 40 },
    });
    expect(wheelAction(wheel(-40, 500), idle, never)).toMatchObject({ kind: "step", dir: -1 });
  });

  it("converts line deltas (x16)", () => {
    const result = wheelAction(wheel(3, 500, false, 1), idle, never);
    expect(result.state.lastAbs).toBe(48);
  });

  it("swallows everything while a transition runs, even with inner scroll room", () => {
    const quiet: WheelState = { quiet: true, lastWheel: 400, lastAbs: 30 };
    const result = wheelAction(wheel(40, 500, true), quiet, always);
    expect(result).toEqual({
      kind: "swallow",
      state: { quiet: true, lastWheel: 500, lastAbs: 40 },
    });
  });

  describe("while swallowing momentum (quiet)", () => {
    const quiet: WheelState = { quiet: true, lastWheel: 1000, lastAbs: 40 };

    it("swallows a decaying tail", () => {
      const result = wheelAction(wheel(30, 1050), quiet, never);
      expect(result).toEqual({
        kind: "swallow",
        state: { quiet: true, lastWheel: 1050, lastAbs: 30 },
      });
    });

    it("swallows a stronger push that is not strong enough", () => {
      // 70 is above 24 but not above 40 * 1.8 = 72
      expect(wheelAction(wheel(70, 1050), quiet, never).kind).toBe("swallow");
    });

    it("starts a new gesture on a much stronger push", () => {
      const result = wheelAction(wheel(73, 1050), quiet, never);
      expect(result).toEqual({
        kind: "step",
        dir: 1,
        state: { quiet: false, lastWheel: 1050, lastAbs: 73 },
      });
    });

    it("needs a fresh push above 24 px to count as stronger", () => {
      const small: WheelState = { quiet: true, lastWheel: 1000, lastAbs: 10 };
      expect(wheelAction(wheel(20, 1050), small, never).kind).toBe("swallow"); // 20 > 18 but <= 24
      expect(wheelAction(wheel(25, 1050), small, never).kind).toBe("step");
    });

    it("starts a new gesture after a pause longer than 160 ms", () => {
      expect(wheelAction(wheel(10, 1160), quiet, never).kind).toBe("swallow"); // exactly 160
      expect(wheelAction(wheel(10, 1161), quiet, never).kind).toBe("step");
    });
  });
});

describe("keyDirection", () => {
  it("maps down keys and space", () => {
    expect(keyDirection("ArrowDown", false)).toBe(1);
    expect(keyDirection("PageDown", false)).toBe(1);
    expect(keyDirection(" ", false)).toBe(1);
  });

  it("maps up keys and shift+space", () => {
    expect(keyDirection("ArrowUp", false)).toBe(-1);
    expect(keyDirection("PageUp", false)).toBe(-1);
    expect(keyDirection(" ", true)).toBe(-1);
  });

  it("ignores other keys", () => {
    expect(keyDirection("Enter", false)).toBeNull();
    expect(keyDirection("a", true)).toBeNull();
  });
});

describe("touch helpers", () => {
  it("follows the finger 1:1 and clamps to the screen", () => {
    expect(touchOffset(1, 800, 0)).toBe(800);
    expect(touchOffset(1, 800, 300)).toBe(500);
    expect(touchOffset(1, 800, 900)).toBe(0);
    expect(touchOffset(1, 800, -50)).toBe(800);
    expect(touchOffset(-1, 800, -300)).toBe(300);
    expect(touchOffset(-1, 800, 50)).toBe(0);
    expect(touchOffset(-1, 800, -900)).toBe(800);
  });

  it("smooths the velocity 0.8 new / 0.2 old", () => {
    // finger moved up 10px in 10ms: raw 1 px/ms
    expect(smoothVelocity(0.5, 110, 100, 10)).toBeCloseTo(0.8 * 1 + 0.2 * 0.5);
    expect(smoothVelocity(0.5, 110, 100, 0)).toBe(0.5);
  });

  it("clamps the finishing duration to 180..450 ms", () => {
    expect(clampDuration(50)).toBe(180);
    expect(clampDuration(300)).toBe(300);
    expect(clampDuration(2000)).toBe(450);
  });
});

describe("touchOutcome", () => {
  const H = 800;
  const release = (over: Partial<Parameters<typeof touchOutcome>[0]> = {}) => ({
    dir: 1 as const,
    off: 400,
    height: H,
    velocity: 0,
    sinceLastMoveMs: 0,
    ...over,
  });

  it("commits when dragged further than 15% of the screen", () => {
    // forward: offset 680 = 120px moved = exactly 15%, not enough
    expect(touchOutcome(release({ off: 680 })).commit).toBe(false);
    expect(touchOutcome(release({ off: 679 })).commit).toBe(true);
  });

  it("measures backward drags from the top", () => {
    expect(touchOutcome(release({ dir: -1, off: 120 })).commit).toBe(false);
    expect(touchOutcome(release({ dir: -1, off: 121 })).commit).toBe(true);
  });

  it("commits on a forward flick even with a short drag", () => {
    expect(touchOutcome(release({ off: 780, velocity: 0.36 })).commit).toBe(true);
    expect(touchOutcome(release({ off: 780, velocity: 0.35 })).commit).toBe(false);
  });

  it("commits on a backward flick for a backward drag", () => {
    expect(touchOutcome(release({ dir: -1, off: 20, velocity: -0.4 })).commit).toBe(true);
  });

  it("cancels on a reverse flick even after a long drag", () => {
    expect(touchOutcome(release({ off: 100, velocity: -0.4 })).commit).toBe(false);
    expect(touchOutcome(release({ dir: -1, off: 700, velocity: 0.4 })).commit).toBe(false);
  });

  it("drops the flick when the finger rested before lifting", () => {
    expect(touchOutcome(release({ off: 780, velocity: 2, sinceLastMoveMs: 121 })).commit).toBe(
      false,
    );
    expect(touchOutcome(release({ off: 780, velocity: 2, sinceLastMoveMs: 120 })).commit).toBe(
      true,
    );
  });

  it("uses the screen edge when the slide never moved", () => {
    const forward = touchOutcome(release({ off: null }));
    expect(forward.from).toBe(H);
    expect(forward.commit).toBe(false);
    expect(forward.settleTo).toBe(H);
    const backward = touchOutcome(release({ dir: -1, off: null }));
    expect(backward.from).toBe(0);
    expect(backward.settleTo).toBe(0);
  });

  it("sizes the duration from the remaining distance and speed, clamped to 180..450", () => {
    // committed, 400px remaining at the minimum speed 1.2 px/ms: 400/1.2 + 110 = 443
    expect(touchOutcome(release()).duration).toBeCloseTo(400 / 1.2 + 110);
    // fast flick near the end: floored at 180
    expect(touchOutcome(release({ off: 50, velocity: 5 })).duration).toBe(180);
    // long way left at the slowest speed: capped at 450
    expect(touchOutcome(release({ off: 3399, velocity: 0, height: 4000 })).duration).toBe(450);
  });

  it("sizes a snap-back from the distance travelled", () => {
    // moved 100px (not committed): 100/1.2 + 110
    expect(touchOutcome(release({ off: 700 })).duration).toBeCloseTo(100 / 1.2 + 110);
  });
});

describe("cosineEase", () => {
  it("hits its endpoints and midpoint", () => {
    expect(cosineEase(0)).toBeCloseTo(0);
    expect(cosineEase(0.5)).toBeCloseTo(0.5);
    expect(cosineEase(1)).toBeCloseTo(1);
  });

  it("eases in and out", () => {
    expect(cosineEase(0.1)).toBeLessThan(0.1);
    expect(cosineEase(0.9)).toBeGreaterThan(0.9);
  });
});

describe("scrollDuration", () => {
  it("starts at 300 ms and grows 0.25 ms per px", () => {
    expect(scrollDuration(0)).toBe(300);
    expect(scrollDuration(400)).toBe(400);
    expect(scrollDuration(-400)).toBe(400);
  });

  it("caps at 900 ms", () => {
    expect(scrollDuration(2400)).toBe(900);
    expect(scrollDuration(100000)).toBe(900);
  });
});

describe("jumpDuration", () => {
  it("takes 1.25x longer across more than one screen", () => {
    expect(jumpDuration(1)).toBe(450);
    expect(jumpDuration(2)).toBe(562.5);
  });
});
