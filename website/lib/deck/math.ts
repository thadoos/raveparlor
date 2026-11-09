import {
  DURATION,
  MULTI_SLIDE_FACTOR,
  SCROLL_BASE_MS,
  SCROLL_EDGE_TOLERANCE_PX,
  SCROLL_MAX_MS,
  SCROLL_MS_PER_PX,
  TOUCH_COMMIT_RATIO,
  TOUCH_FLICK_SPEED,
  TOUCH_MIN_DURATION_MS,
  TOUCH_MIN_SPEED,
  TOUCH_REST_MS,
  TOUCH_SETTLE_PAD_MS,
  TOUCH_VELOCITY_WEIGHT,
  WHEEL_FRESH_MIN_DELTA,
  WHEEL_FRESH_RATIO,
  WHEEL_LINE_PX,
  WHEEL_MIN_DELTA,
  WHEEL_QUIET_PAUSE_MS,
} from "./constants";

/** +1 moves toward the next slide, -1 toward the previous one. */
export type Direction = 1 | -1;

export interface ScrollMetrics {
  /** False for slides that never scroll internally. */
  scrollable: boolean;
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
}

/** Whether a scrolling slide still has room to scroll in `dir`. */
export function canScroll(metrics: ScrollMetrics, dir: Direction): boolean {
  if (!metrics.scrollable) return false;
  if (dir > 0) {
    return (
      metrics.scrollTop + metrics.clientHeight < metrics.scrollHeight - SCROLL_EDGE_TOLERANCE_PX
    );
  }
  return metrics.scrollTop > 0;
}

export interface WheelState {
  /** Swallowing the tail of a trackpad momentum burst. */
  quiet: boolean;
  lastWheel: number;
  lastAbs: number;
}

export interface WheelInput {
  deltaY: number;
  deltaMode: number;
  now: number;
  /** A slide transition is running. */
  busy: boolean;
}

export type WheelResult =
  /** Too small to matter: leave the event and the state alone. */
  | { kind: "ignore"; state: WheelState }
  /** Let the browser scroll the slide natively. */
  | { kind: "native"; state: WheelState }
  /** Cancel the event, do not move. */
  | { kind: "swallow"; state: WheelState }
  /** Cancel the event and move one slide in `dir`. */
  | { kind: "step"; dir: Direction; state: WheelState };

/** Decides what one wheel event does. `canScrollToward` asks the current slide about inner scroll. */
export function wheelAction(
  input: WheelInput,
  state: WheelState,
  canScrollToward: (dir: Direction) => boolean,
): WheelResult {
  const dy = input.deltaMode === 1 ? input.deltaY * WHEEL_LINE_PX : input.deltaY;
  const abs = Math.abs(dy);
  if (abs < WHEEL_MIN_DELTA) return { kind: "ignore", state };

  const dir: Direction = dy > 0 ? 1 : -1;
  const seen: WheelState = { quiet: state.quiet, lastWheel: input.now, lastAbs: abs };

  if (!input.busy && canScrollToward(dir)) {
    return { kind: "native", state: { ...seen, quiet: true } };
  }
  if (input.busy) return { kind: "swallow", state: seen };

  if (state.quiet) {
    // swallow trackpad momentum; a pause or a fresh, stronger push starts a new move
    const fresh =
      input.now - state.lastWheel > WHEEL_QUIET_PAUSE_MS ||
      (abs > state.lastAbs * WHEEL_FRESH_RATIO && abs > WHEEL_FRESH_MIN_DELTA);
    if (!fresh) return { kind: "swallow", state: seen };
    return { kind: "step", dir, state: { ...seen, quiet: false } };
  }
  return { kind: "step", dir, state: seen };
}

/** Maps a key press to a slide direction, or null when the key does nothing here. */
export function keyDirection(key: string, shiftKey: boolean): Direction | null {
  if (key === "ArrowDown" || key === "PageDown" || (key === " " && !shiftKey)) return 1;
  if (key === "ArrowUp" || key === "PageUp" || (key === " " && shiftKey)) return -1;
  return null;
}

/** Offset (px from the top) of the dragged slide: `dy` is how far the finger moved toward "forward". */
export function touchOffset(dir: Direction, height: number, dy: number): number {
  return dir > 0 ? Math.min(height, Math.max(0, height - dy)) : Math.min(height, Math.max(0, -dy));
}

/** Smooths the finger velocity in px/ms (positive = forward). */
export function smoothVelocity(previous: number, lastY: number, y: number, dt: number): number {
  if (dt <= 0) return previous;
  return TOUCH_VELOCITY_WEIGHT * ((lastY - y) / dt) + (1 - TOUCH_VELOCITY_WEIGHT) * previous;
}

/** Keeps a finishing animation between the shortest allowed and the full per-screen duration. */
export function clampDuration(ms: number): number {
  return Math.max(TOUCH_MIN_DURATION_MS, Math.min(DURATION, ms));
}

export interface TouchRelease {
  dir: Direction;
  /** Last drag offset, or null when the finger never moved the slide. */
  off: number | null;
  height: number;
  /** Smoothed velocity in px/ms, positive = forward. */
  velocity: number;
  /** Time since the last touchmove sample. */
  sinceLastMoveMs: number;
}

export interface TouchOutcome {
  /** Finish the move to the next/previous slide (otherwise snap back). */
  commit: boolean;
  /** Where the dragged slide currently sits. */
  from: number;
  /** Where it snaps back to when not committing. */
  settleTo: number;
  duration: number;
}

/** Decides how a released drag finishes. */
export function touchOutcome(release: TouchRelease): TouchOutcome {
  const { dir, height } = release;
  const off = release.off ?? (dir > 0 ? height : 0);
  // finger rested before lifting: no flick
  const v = release.sinceLastMoveMs > TOUCH_REST_MS ? 0 : release.velocity;
  const moved = dir > 0 ? height - off : off; // px travelled toward the next screen
  const flick = dir > 0 ? v > TOUCH_FLICK_SPEED : v < -TOUCH_FLICK_SPEED;
  const back = dir > 0 ? v < -TOUCH_FLICK_SPEED : v > TOUCH_FLICK_SPEED;
  const commit = !back && (moved > height * TOUCH_COMMIT_RATIO || flick);
  const rest = commit ? height - moved : moved;
  const speed = Math.max(Math.abs(v), TOUCH_MIN_SPEED);
  return {
    commit,
    from: off,
    settleTo: dir > 0 ? height : 0,
    duration: clampDuration(rest / speed + TOUCH_SETTLE_PAD_MS),
  };
}

/** Cosine in-out easing for t in [0, 1]. */
export function cosineEase(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/** Duration of an inner scroll over `distance` px. */
export function scrollDuration(distance: number): number {
  return Math.min(SCROLL_MAX_MS, SCROLL_BASE_MS + Math.abs(distance) * SCROLL_MS_PER_PX);
}

/** Duration of an in-page jump across `slidesApart` slides. */
export function jumpDuration(slidesApart: number): number {
  return slidesApart > 1 ? DURATION * MULTI_SLIDE_FACTOR : DURATION;
}
