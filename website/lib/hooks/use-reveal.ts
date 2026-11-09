import { useEffect, useState, type RefCallback } from "react";
import { useReducedMotion } from "./use-media";

const THRESHOLD = 0.15;

export interface RevealControls {
  /** Attach to the element that fades in (as its `ref`). */
  attach: RefCallback<HTMLElement>;
  /** `reveal in` while visible, `reveal` while waiting to scroll into view (see `.reveal` in globals.css). */
  className: string;
}

/**
 * Fade-in on scroll. The element renders visible (so it works without JS); once attached it hides
 * (before the first paint) and fades in the first time 15% of it is in view. Reduced motion, or no
 * IntersectionObserver, leaves it visible.
 */
export function useReveal(): RevealControls {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);
  const reduced = useReducedMotion();
  const supported = node !== null && "IntersectionObserver" in window;

  useEffect(() => {
    if (!node || !supported || seen || reduced) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setSeen(true);
        observer.disconnect();
      },
      { threshold: THRESHOLD },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, supported, seen, reduced]);

  const waiting = supported && !seen && !reduced;
  return { attach: setNode, className: waiting ? "reveal" : "reveal in" };
}
