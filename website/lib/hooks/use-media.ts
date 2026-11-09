import { useCallback, useSyncExternalStore } from "react";
import { PHONE_QUERY, REDUCED_MOTION_QUERY } from "@/lib/deck/constants";

/** Tracks a CSS media query. Renders `false` on the server and during hydration. */
export function useMedia(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function getServerSnapshot(): boolean {
  return false;
}

/** True at the narrow-screen breakpoint where the deck uses its phone layout. */
export function usePhone(): boolean {
  return useMedia(PHONE_QUERY);
}

/** True when the visitor asked the OS for reduced motion. */
export function useReducedMotion(): boolean {
  return useMedia(REDUCED_MOTION_QUERY);
}
