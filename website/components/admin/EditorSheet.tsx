"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import styles from "./EditorSheet.module.css";

interface EditorSheetProps {
  title: string;
  /** Changes when another region is opened; focus moves back into the sheet each time. */
  focusKey: string;
  onClose: () => void;
  children: ReactNode;
}

/** How far the handle has to be dragged down to close the sheet. */
const CLOSE_DRAG_PX = 80;

/**
 * The editor beside the preview: a bottom sheet on phones (drag the handle down or press close)
 * and a side panel from 820px. Escape closes it. Focus moves in on open and goes back on close.
 */
export function EditorSheet({ title, focusKey, onClose, children }: EditorSheetProps) {
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  const drag = useRef<{ startY: number } | null>(null);
  const [dragY, setDragY] = useState(0);

  // Restore focus to whatever had it before the sheet opened (usually the preview iframe).
  useEffect(() => {
    const opener = document.activeElement;
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected)
        opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [focusKey]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      // An editor's own confirm dialog handles its Escape.
      if (event.target instanceof Element && event.target.closest("dialog[open]")) return;
      onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function onHandleDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startY: event.clientY };
  }

  function onHandleMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setDragY(Math.max(0, event.clientY - drag.current.startY));
  }

  function onHandleUp() {
    if (!drag.current) return;
    drag.current = null;
    if (dragY >= CLOSE_DRAG_PX) onClose();
    else setDragY(0);
  }

  return (
    <section
      ref={ref}
      className={styles.sheet}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
    >
      <div
        className={styles.handle}
        aria-hidden="true"
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        onPointerCancel={onHandleUp}
      >
        <span className={styles.grip} />
      </div>
      <header className={styles.head}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <button type="button" className={styles.close} aria-label="Close editor" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
