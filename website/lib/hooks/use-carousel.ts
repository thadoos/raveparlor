import { useCallback, useEffect, useState } from "react";

export interface Carousel {
  index: number;
  select: (i: number) => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Index of the visible item in a looping carousel. Advances every `intervalMs` unless paused,
 * there is nothing to rotate (`count` < 2) or the visitor asked for reduced motion. Selecting an
 * item restarts the timer.
 */
export function useCarousel(count: number, intervalMs: number): Carousel {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [index, paused, count, intervalMs]);

  const select = useCallback((i: number) => setIndex(i), []);
  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  return { index, select, pause, resume };
}
