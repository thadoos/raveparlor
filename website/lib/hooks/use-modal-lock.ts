import { useLayoutEffect } from "react";

const CLASS_NAME = "modal-open";

/** How many modals currently hold the lock. */
let holders = 0;

/**
 * While `active`, keeps `modal-open` on `<html>`: the page behind stops scrolling and the deck
 * stands down. Refcounted, so overlapping modals never clear each other's lock.
 */
export function useModalLock(active: boolean): void {
  // layout effect: the lock must be in place before a modal measures itself
  useLayoutEffect(() => {
    if (!active) return;
    holders += 1;
    document.documentElement.classList.add(CLASS_NAME);
    return () => {
      holders -= 1;
      if (holders === 0) document.documentElement.classList.remove(CLASS_NAME);
    };
  }, [active]);
}
