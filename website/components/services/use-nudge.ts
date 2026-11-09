import { useCallback, useEffect, useRef, useState } from "react";
import { NUDGE_MS } from "./dialog-motion";

/** A flag that turns on for `NUDGE_MS` each time `nudge()` is called. */
export function useNudge(): [boolean, () => void] {
  const [active, setActive] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const nudge = useCallback(() => {
    window.clearTimeout(timer.current);
    setActive(true);
    timer.current = window.setTimeout(() => setActive(false), NUDGE_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return [active, nudge];
}
