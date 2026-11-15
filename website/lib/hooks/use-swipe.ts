import { useEffect, useRef } from "react";
import type { PointerEvent, RefObject } from "react";

const SWIPE_MIN_PX = 40;
const WHEEL_TRIGGER_PX = 60;
const WHEEL_QUIET_MS = 150;

interface SwipeHandlers {
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
}

interface PointerStart {
  x: number;
  y: number;
  id: number;
}

/** Horizontal swipe for touch, mouse drag and trackpad two-finger scroll. */
export function useSwipe(
  ref: RefObject<HTMLElement | null>,
  onPrev: () => void,
  onNext: () => void,
): SwipeHandlers {
  const prevRef = useRef(onPrev);
  const nextRef = useRef(onNext);
  const startRef = useRef<PointerStart | null>(null);

  useEffect(() => {
    prevRef.current = onPrev;
    nextRef.current = onNext;
  }, [onPrev, onNext]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let acc = 0;
    let locked = false;
    let timer: number | undefined;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      e.stopPropagation();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        acc = 0;
        locked = false;
      }, WHEEL_QUIET_MS);
      if (locked) return;
      acc += e.deltaX;
      if (Math.abs(acc) >= WHEEL_TRIGGER_PX) {
        locked = true;
        if (acc > 0) nextRef.current();
        else prevRef.current();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(timer);
    };
  }, [ref]);

  return {
    onPointerDown: (e) => {
      if (e.button !== 0 || !e.isPrimary) return;
      startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: () => {},
    onPointerUp: (e) => {
      const start = startRef.current;
      if (!start || start.id !== e.pointerId) return;
      startRef.current = null;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return;
      if (dx < 0) nextRef.current();
      else prevRef.current();
    },
    onPointerCancel: () => {
      startRef.current = null;
    },
  };
}
