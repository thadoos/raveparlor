import type { ScrollMetrics } from "./math";

/** Classes the controller toggles on slides. */
const STATE_CLASSES = ["is-current", "is-under", "is-far", "pre", "moving"] as const;

export function isScrollSlide(slide: Element | undefined | null): slide is HTMLElement {
  return !!slide && slide.classList.contains("scroll");
}

export function slideMetrics(slide: HTMLElement): ScrollMetrics {
  return {
    scrollable: isScrollSlide(slide),
    scrollTop: slide.scrollTop,
    clientHeight: slide.clientHeight,
    scrollHeight: slide.scrollHeight,
  };
}

export function translateY(y: number): string {
  return `translate3d(0,${y}px,0)`;
}

/** Reading a layout property forces the browser to commit the styles set so far. */
export function forceReflow(el: HTMLElement): number {
  return el.offsetHeight;
}

/** Removes everything the controller added to a slide (state classes and inline styles). */
export function resetSlide(slide: HTMLElement): void {
  slide.classList.remove(...STATE_CLASSES);
  slide.style.transform = "";
  slide.style.transition = "";
  slide.style.zIndex = "";
  slide.style.visibility = "";
}
