/** Timings and easings of the service dialog, shared by the open and close sequences. */

/** Panel expands from the card. */
export const EXPAND_MS = 560;
export const EXPAND_EASE = "cubic-bezier(.2,.75,.15,1)";
/** The content fades in (and the dialog is usable) this long before the expand finishes. */
export const READY_AT_MS = EXPAND_MS - 120;

/** Wait before the panel starts collapsing back to the card. */
export const COLLAPSE_DELAY_MS = 160;
export const COLLAPSE_MS = EXPAND_MS - 80;
export const COLLAPSE_EASE = "cubic-bezier(.5,0,.2,1)";
/** After the collapse starts, the dialog closes this long later. */
export const FINISH_AFTER_COLLAPSE_START_MS = EXPAND_MS - 60;

/** How long the price area shakes when "Continue" is pressed with nothing picked. */
export const NUDGE_MS = 600;
