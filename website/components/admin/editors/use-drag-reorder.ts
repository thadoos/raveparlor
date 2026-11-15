"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { dragOffsets, dragTargetIndex } from "@/lib/admin/drag-reorder";

interface Drag {
  id: string;
  pointerId: number;
  startIndex: number;
  startY: number;
  /** Row heights in list order, measured when the drag starts. */
  heights: number[];
  deltaY: number;
}

type HandleEvent = ReactPointerEvent<HTMLButtonElement>;

/**
 * Drag-to-reorder for a list of rows. The DOM order never changes mid-drag (moving the capturing
 * node would drop pointer capture): the preview is drawn with translateY and `onMove` runs on
 * release. Handlers read a ref, so a pointerup followed by lostpointercapture can't act on a
 * stale drag.
 */
export function useDragReorder(ids: string[], onMove: (id: string, toIndex: number) => void) {
  const [drag, setDragState] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const rows = useRef(new Map<string, HTMLElement>());

  const toIndex = drag ? dragTargetIndex(drag.startIndex, drag.deltaY, drag.heights) : -1;
  const offsets = drag ? dragOffsets(drag.startIndex, toIndex, drag.deltaY, drag.heights) : null;

  function setDrag(next: Drag | null) {
    dragRef.current = next;
    setDragState(next);
  }

  function endDrag(event: HandleEvent, commit: boolean) {
    const current = dragRef.current;
    if (!current || event.pointerId !== current.pointerId) return;
    setDrag(null);
    if (!commit) return;
    const to = dragTargetIndex(current.startIndex, current.deltaY, current.heights);
    if (to !== current.startIndex) onMove(current.id, to);
  }

  return {
    /** The id being dragged, or null. */
    draggingId: drag?.id ?? null,
    /** translateY for the row at `index` while dragging, else undefined. */
    offsetAt: (index: number) => (offsets ? offsets[index] : undefined),
    /** Ref callback for a row's element. */
    rowRef: (id: string) => (node: HTMLElement | null) => {
      if (node) rows.current.set(id, node);
      else rows.current.delete(id);
    },
    /** Pointer handlers for a row's drag handle. */
    handleProps: (id: string) => ({
      onPointerDown(event: HandleEvent) {
        if (event.button !== 0 || dragRef.current) return;
        const startIndex = ids.indexOf(id);
        if (startIndex === -1) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const heights = ids.map((i) => rows.current.get(i)?.getBoundingClientRect().height ?? 0);
        setDrag({
          id,
          pointerId: event.pointerId,
          startIndex,
          startY: event.clientY,
          heights,
          deltaY: 0,
        });
      },
      onPointerMove(event: HandleEvent) {
        const current = dragRef.current;
        if (!current || event.pointerId !== current.pointerId) return;
        setDrag({ ...current, deltaY: event.clientY - current.startY });
      },
      onPointerUp: (event: HandleEvent) => endDrag(event, true),
      onPointerCancel: (event: HandleEvent) => endDrag(event, false),
      onLostPointerCapture: (event: HandleEvent) => endDrag(event, false),
    }),
  };
}
