/** `id` of the deck element (the skip link's target). */
export const DECK_ID = "deck";

/** Milliseconds per screen for wheel, keys and in-page links. */
export const DURATION = 450;
/** Gentle in-out easing for programmatic moves. */
export const EASE = "cubic-bezier(.37,0,.63,1)";
/** Easing for finishing a finger drag. */
export const EASE_OUT = "cubic-bezier(.22,.61,.36,1)";

export const PHONE_QUERY = "(max-width: 820px)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Safety timeout added to a transition in case `transitionend` never fires. */
export const TRANSITION_END_PAD_MS = 80;
/** A scrolling slide still counts as scrollable this many px before its end. */
export const SCROLL_EDGE_TOLERANCE_PX = 1;

/** Wheel events reported in lines (deltaMode 1) are converted with this factor. */
export const WHEEL_LINE_PX = 16;
/** Wheel deltas smaller than this are ignored. */
export const WHEEL_MIN_DELTA = 1;
/** A pause longer than this ends a momentum burst. */
export const WHEEL_QUIET_PAUSE_MS = 160;
/** A push this much stronger than the previous event starts a new gesture... */
export const WHEEL_FRESH_RATIO = 1.8;
/** ...as long as it is also at least this strong. */
export const WHEEL_FRESH_MIN_DELTA = 24;

/** Vertical travel before a touch is classified. */
export const TOUCH_DECIDE_PX = 6;
/** Fraction of the screen height after which a release commits the move. */
export const TOUCH_COMMIT_RATIO = 0.15;
/** Release speed (px/ms) that counts as a flick. */
export const TOUCH_FLICK_SPEED = 0.35;
/** A finger resting longer than this before lifting cancels the flick. */
export const TOUCH_REST_MS = 120;
/** Weight of the newest sample in the velocity smoothing. */
export const TOUCH_VELOCITY_WEIGHT = 0.8;
/** Floor for the speed used to size the finishing animation. */
export const TOUCH_MIN_SPEED = 1.2;
/** Extra time added to the finishing animation. */
export const TOUCH_SETTLE_PAD_MS = 110;
/** Shortest finishing animation after a drag. */
export const TOUCH_MIN_DURATION_MS = 180;

/** Inner-scroll animation: base duration, per-pixel cost and cap (ms). */
export const SCROLL_BASE_MS = 300;
export const SCROLL_MS_PER_PX = 0.25;
export const SCROLL_MAX_MS = 900;
/** Jumps over more than one screen take this much longer. */
export const MULTI_SLIDE_FACTOR = 1.25;
