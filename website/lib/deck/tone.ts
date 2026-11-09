import { isScrollSlide } from "./slide";

export interface HeaderTone {
  /** Light logo and burger over a dark screen. */
  dark: boolean;
  /** Frosted bar behind the header. */
  blur: boolean;
}

export const LIGHT_TONE: HeaderTone = { dark: false, blur: false };

/** A section can set a different tone for phones (data-tone-m), e.g. when its layout changes there. */
export function toneOf(el: Element, phone: boolean): string | null {
  return phone && el.hasAttribute("data-tone-m")
    ? el.getAttribute("data-tone-m")
    : el.getAttribute("data-tone");
}

export function sameTone(a: HeaderTone, b: HeaderTone): boolean {
  return a.dark === b.dark && a.blur === b.blur;
}

/** Reads the tone of whatever is painted under the header (ignoring the header and the modal). */
export function computeTone(head: HTMLElement, phone: boolean): HeaderTone {
  const y = head.offsetHeight / 2;
  const hits = document.elementsFromPoint(window.innerWidth / 2, y);
  for (const hit of hits) {
    if (head.contains(hit) || hit.closest(".md")) continue;
    const host = hit.closest("[data-tone]");
    if (host) {
      return { dark: toneOf(host, phone) === "dark", blur: hit.closest("[data-blur]") !== null };
    }
  }
  return LIGHT_TONE;
}

/**
 * The tone for a screen that is arriving, applied when its transition starts. Null when the
 * screen is already scrolled: that is decided from what is under the header once it lands.
 */
export function toneHint(slide: HTMLElement, phone: boolean): HeaderTone | null {
  const scrolling = isScrollSlide(slide);
  if (scrolling && slide.scrollTop > 4) return null;
  return {
    dark: toneOf(slide, phone) === "dark",
    blur:
      slide.hasAttribute("data-blur") ||
      (scrolling && slide.querySelector(":scope > [data-blur]:first-child") !== null),
  };
}
