import type { Box } from "@/lib/rect-transform";

/** Width of the phone viewer's track relative to its view (the image is wider than the window). */
export const PHONE_TRACK_RATIO = 1.7544;
/** Wide screens show the whole image in the view. */
export const DESKTOP_TRACK_RATIO = 1;

/** Duration of the poster opening out of (and folding back into) the page. */
export const POSTER_MOTION_MS = 520;
export const POSTER_EASE = "cubic-bezier(0.2,0.7,0.2,1)";
/** Duration of the plain fade used for reduced motion and when the in-page poster can't be measured. */
export const POSTER_FADE_MS = 200;

export interface PosterStartFrame {
  /** Transform (origin 0 0) that makes the view's whole track sit exactly on the in-page poster. */
  transform: string;
  /** Clip that reveals the whole track, or null when the view already shows all of it. */
  clipPath: string | null;
}

/** True for a measured box that can be animated from or to: finite numbers and a real size. */
export function isUsableBox(box: Box | null | undefined): box is Box {
  return (
    box != null &&
    Number.isFinite(box.left) &&
    Number.isFinite(box.top) &&
    Number.isFinite(box.width) &&
    Number.isFinite(box.height) &&
    box.width > 0 &&
    box.height > 0
  );
}

/**
 * Uniform scale that shrinks the view's whole track (`trackRatio` times the view's width) down to
 * the in-page poster's width.
 */
export function posterScale(thumb: Box, view: Box, trackRatio: number): number {
  return thumb.width / (view.width * trackRatio);
}

/** Clip that shows the whole track instead of only the view's window onto it. */
export function revealAllClip(trackRatio: number): string | null {
  if (trackRatio <= 1) return null;
  const hiddenPercent = Number(((trackRatio - 1) * 100).toFixed(4));
  return `inset(0 -${hiddenPercent}% 0 0)`;
}

/** The view's first animation frame: the whole poster exactly on top of the in-page poster. */
export function posterStartFrame(thumb: Box, view: Box, trackRatio: number): PosterStartFrame {
  const dx = thumb.left - view.left;
  const dy = thumb.top - view.top;
  const scale = posterScale(thumb, view, trackRatio);
  return {
    transform: `translate(${dx}px,${dy}px) scale(${scale})`,
    clipPath: revealAllClip(trackRatio),
  };
}
