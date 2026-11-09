import { useEffect, useState, type RefObject } from "react";
import { useDeck } from "@/components/deck/use-deck";
import { LIGHT_TONE, computeTone, sameTone, toneHint, type HeaderTone } from "@/lib/deck/tone";
import { usePhone } from "@/lib/hooks/use-media";

/**
 * The header's logo colour and blur, following whatever is painted under it. While the menu is
 * open the header is always light and not blurred. Measuring is rAF-throttled; a screen that is
 * arriving sets its tone immediately, when its transition starts.
 */
export function useHeaderTone(
  headRef: RefObject<HTMLElement | null>,
  menuOpen: boolean,
): HeaderTone {
  const deck = useDeck();
  const phone = usePhone();
  const [measured, setMeasured] = useState<HeaderTone>(LIGHT_TONE);

  useEffect(() => {
    let frame = 0;
    const apply = (next: HeaderTone): void =>
      setMeasured((prev) => (sameTone(prev, next) ? prev : next));
    const measure = (): void => {
      frame = 0;
      const head = headRef.current;
      if (head) apply(computeTone(head, phone));
    };
    const schedule = (): void => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    const offArrive = deck.on("arrive", (slide) => {
      const hint = toneHint(slide, phone);
      if (hint) apply(hint);
    });
    const offSettle = deck.on("settle", schedule);
    const offScroll = deck.on("scroll", schedule);
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("load", schedule);
    schedule();

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      offArrive();
      offSettle();
      offScroll();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", schedule);
    };
  }, [deck, phone, headRef]);

  return menuOpen ? LIGHT_TONE : measured;
}
