"use client";

import { useEffect, useState } from "react";
import styles from "./EditOverlay.module.css";

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

function union(a: Box | null, r: DOMRect): Box | null {
  if (r.width === 0 && r.height === 0) return a;
  if (!a) return { top: r.top, left: r.left, width: r.width, height: r.height };
  const top = Math.min(a.top, r.top);
  const left = Math.min(a.left, r.left);
  const bottom = Math.max(a.top + a.height, r.bottom);
  const right = Math.max(a.left + a.width, r.right);
  return { top, left, width: right - left, height: bottom - top };
}

/** The union of a box-less (`display: contents`) element's content: child boxes and text. */
function measureContents(el: Element): Box | null {
  let box: Box | null = null;
  for (const node of el.childNodes) {
    if (node instanceof Element) {
      const display = getComputedStyle(node).display;
      if (display === "none") continue;
      if (display === "contents") {
        const inner = measureContents(node);
        if (inner) box = union(box, new DOMRect(inner.left, inner.top, inner.width, inner.height));
      } else {
        box = union(box, node.getBoundingClientRect());
      }
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      const range = document.createRange();
      range.selectNodeContents(node);
      box = union(box, range.getBoundingClientRect());
    }
  }
  return box;
}

function measure(el: Element): Box | null {
  if (getComputedStyle(el).display === "contents") return measureContents(el);
  return union(null, el.getBoundingClientRect());
}

function sameBox(a: Box | null, b: Box | null): boolean {
  if (!a || !b) return a === b;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

/** Frames with an unchanged box before the re-measure loop idles. */
const IDLE_FRAMES = 10;

/**
 * Outlines the editable region under the pointer. While one is hovered it is re-measured every
 * frame, so the outline follows deck slides and scrolling. Once the box has held still for a few
 * frames the loop idles; pointer movement, scrolling, resizing and anything that can start a deck
 * slide (wheel, keys, CSS transitions) wake it again.
 */
export function EditOverlay() {
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    let hovered: Element | null = null;
    let frame = 0;
    let last: Box | null = null;
    let still = 0;

    function tick() {
      frame = 0;
      const next = hovered?.isConnected ? measure(hovered) : null;
      still = sameBox(last, next) ? still + 1 : 0;
      last = next;
      setBox((prev) => (sameBox(prev, next) ? prev : next));
      if (hovered && still < IDLE_FRAMES) frame = requestAnimationFrame(tick);
    }

    function wake() {
      still = 0;
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function onPointerMove(e: PointerEvent) {
      hovered = e.target instanceof Element ? e.target.closest("[data-edit-target]") : null;
      wake();
    }

    function onLeave() {
      hovered = null;
      wake();
    }

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    // Capture so scrolls and transitions inside any element count.
    const wakeEvents = ["scroll", "wheel", "keydown", "transitionrun"] as const;
    for (const type of wakeEvents) {
      document.addEventListener(type, wake, { capture: true, passive: true });
    }
    window.addEventListener("resize", wake);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      for (const type of wakeEvents) document.removeEventListener(type, wake, { capture: true });
      window.removeEventListener("resize", wake);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  if (!box) return null;
  return (
    <div
      className={styles.box}
      data-tone-ignore
      aria-hidden="true"
      style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
    />
  );
}
