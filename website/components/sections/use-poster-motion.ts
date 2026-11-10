import { useCallback, useEffect, useRef, type RefObject } from "react";
import { flushSync } from "react-dom";
import { PHONE_QUERY, REDUCED_MOTION_QUERY } from "@/lib/deck/constants";
import {
  DESKTOP_TRACK_RATIO,
  PHONE_TRACK_RATIO,
  POSTER_EASE,
  POSTER_FADE_MS,
  POSTER_MOTION_MS,
  isUsableBox,
  posterStartFrame,
} from "@/lib/poster-motion";

/** Where the phone track rests on the second half; keep in sync with the CSS. */
const SLIDE_TRANSFORM = "translateX(-43%)";
/** The view's rest clip; keep in sync with the CSS. */
const REST_CLIP = "inset(0)";

interface PosterElements {
  dialog: RefObject<HTMLDialogElement | null>;
  view: RefObject<HTMLDivElement | null>;
  track: RefObject<HTMLDivElement | null>;
  closeButton: RefObject<HTMLButtonElement | null>;
  nav: RefObject<HTMLDivElement | null>;
  /** The in-page poster the viewer grows out of and folds back into. */
  thumb: RefObject<HTMLAnchorElement | null>;
}

interface PosterMotionOptions {
  elements: PosterElements;
  /** Marks the viewer as open (first half) and starts on the first part; run before measuring. */
  showViewer: () => void;
  /** Back to the first part of the poster. */
  resetPart: () => void;
  /** The viewer is closed: releases the modal lock and shows the in-page poster again. */
  hideViewer: () => void;
}

interface PosterMotion {
  open: () => void;
  /** Animated close; used by the X button, the dark area and Esc. */
  close: () => void;
  /** To be called from the dialog's `close` event. */
  handleClosed: () => void;
}

function fade(from: number, to: number): Keyframe[] {
  return [{ opacity: from }, { opacity: to }];
}

function matches(query: string): boolean {
  return window.matchMedia(query).matches;
}

/**
 * Opens and closes the price viewer with the Web Animations API. On open the poster grows out of
 * its in-page spot (on phones from the whole poster, ending on the left-half window); on close the
 * same motion plays backwards. Reduced motion, or an in-page poster that can't be measured, gets
 * a plain fade. Every animation is cancelled on unmount, on re-open and once the dialog is closed.
 */
export function usePosterMotion({
  elements,
  showViewer,
  resetPart,
  hideViewer,
}: PosterMotionOptions): PosterMotion {
  const animations = useRef<Animation[]>([]);
  const closing = useRef(false);

  const cancelAll = useCallback(() => {
    for (const animation of animations.current) animation.cancel();
    animations.current = [];
  }, []);

  useEffect(() => cancelAll, [cancelAll]);

  function play(target: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    const animation = target.animate(keyframes, options);
    animations.current.push(animation);
    return animation;
  }

  function chrome(): HTMLElement[] {
    const { closeButton, nav } = elements;
    const found: (HTMLElement | null)[] = [closeButton.current, nav.current];
    return found.filter((el): el is HTMLElement => el !== null);
  }

  function open() {
    const dialog = elements.dialog.current;
    if (!dialog || dialog.open) return;
    cancelAll();
    closing.current = false;
    // Commit the hidden in-page poster and the modal lock before measuring, so the start rect is
    // taken in the layout the page keeps while the viewer is up (no half-a-scrollbar offset).
    flushSync(showViewer);
    const thumb = elements.thumb.current?.getBoundingClientRect();
    dialog.showModal();
    // showModal focuses the close button, which draws a focus ring on touch until the next tap
    dialog.focus({ preventScroll: true });
    const view = elements.view.current;
    const viewBox = view?.getBoundingClientRect();

    if (!view || matches(REDUCED_MOTION_QUERY) || !isUsableBox(thumb) || !isUsableBox(viewBox)) {
      play(dialog, fade(0, 1), { duration: POSTER_FADE_MS, easing: POSTER_EASE });
      return;
    }

    const ratio = matches(PHONE_QUERY) ? PHONE_TRACK_RATIO : DESKTOP_TRACK_RATIO;
    const start = posterStartFrame(thumb, viewBox, ratio);
    const base: KeyframeAnimationOptions = { duration: POSTER_MOTION_MS, easing: POSTER_EASE };

    const from: Keyframe = { transform: start.transform };
    const to: Keyframe = { transform: "none" };
    if (start.clipPath) {
      from.clipPath = start.clipPath;
      to.clipPath = REST_CLIP;
    }
    play(view, [from, to], base);

    // the dialog itself fades the dark in: animating ::backdrop is unreliable in Safari
    const ink = getComputedStyle(dialog).backgroundColor;
    play(dialog, [{ backgroundColor: "transparent" }, { backgroundColor: ink }], base);

    for (const el of chrome()) {
      play(el, fade(0, 1), {
        duration: POSTER_MOTION_MS / 2,
        delay: POSTER_MOTION_MS / 2,
        easing: POSTER_EASE,
        fill: "backwards",
      });
    }
  }

  function finish() {
    // Show the in-page poster again before the dialog goes: the folded view sits exactly on top of
    // it, so there is no frame where neither is visible (the native close event comes a task later).
    flushSync(hideViewer);
    elements.dialog.current?.close();
    cancelAll();
    closing.current = false;
    // the dialog is hidden by now, so the jump back to the first part is never seen
    resetPart();
  }

  function close() {
    const dialog = elements.dialog.current;
    if (!dialog?.open || closing.current) return;
    closing.current = true;
    // finished open animations stop holding the rest state; ones still running are cut short
    cancelAll();
    const view = elements.view.current;
    const track = elements.track.current;
    const thumb = elements.thumb.current?.getBoundingClientRect();
    const viewBox = view?.getBoundingClientRect();

    if (!view || matches(REDUCED_MOTION_QUERY) || !isUsableBox(thumb) || !isUsableBox(viewBox)) {
      const fadeOut = play(dialog, fade(1, 0), {
        duration: POSTER_FADE_MS,
        easing: POSTER_EASE,
        fill: "forwards",
      });
      fadeOut.onfinish = finish;
      return;
    }

    const phone = matches(PHONE_QUERY);
    const end = posterStartFrame(thumb, viewBox, phone ? PHONE_TRACK_RATIO : DESKTOP_TRACK_RATIO);
    const base: KeyframeAnimationOptions = {
      duration: POSTER_MOTION_MS,
      easing: POSTER_EASE,
      fill: "forwards",
    };

    const from: Keyframe = { transform: "none" };
    const to: Keyframe = { transform: end.transform };
    if (end.clipPath) {
      from.clipPath = REST_CLIP;
      to.clipPath = end.clipPath;
    }
    const folding = play(view, [from, to], base);

    // on the second half the track slides back to the first so the whole poster lands on the page
    if (phone && track && dialog.dataset.part === "1") {
      play(track, [{ transform: SLIDE_TRANSFORM }, { transform: "none" }], base);
    }

    const ink = getComputedStyle(dialog).backgroundColor;
    play(dialog, [{ backgroundColor: ink }, { backgroundColor: "transparent" }], base);

    for (const el of chrome()) {
      play(el, fade(1, 0), { ...base, duration: POSTER_MOTION_MS / 2 });
    }

    folding.onfinish = finish;
  }

  function handleClosed() {
    cancelAll();
    closing.current = false;
    hideViewer();
  }

  return { open, close, handleClosed };
}
