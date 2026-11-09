import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { rectTransform } from "@/lib/rect-transform";
import {
  COLLAPSE_DELAY_MS,
  COLLAPSE_EASE,
  COLLAPSE_MS,
  EXPAND_EASE,
  EXPAND_MS,
  FINISH_AFTER_COLLAPSE_START_MS,
  READY_AT_MS,
} from "./dialog-motion";
import type { DialogState } from "./dialog-state";
import { useServiceDialog } from "./services-context";

/**
 * Runs the service dialog's open and close sequences for the current stage: the native dialog
 * opens, the panel expands out of its card (and collapses back) with the Web Animations API, and
 * the stage advances on the original timings. Every timeout and animation is cancelled on
 * unmount or when the stage changes.
 */
export function useDialogMotion(
  state: DialogState,
  dialogRef: RefObject<HTMLDialogElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
  closeButtonRef: RefObject<HTMLButtonElement | null>,
): void {
  const { dispatch, getCard } = useServiceDialog();
  const { stage, target, animated } = state;
  const animation = useRef<Animation | null>(null);

  // opening: show the native dialog, then expand the panel from the card's rectangle
  useLayoutEffect(() => {
    if (stage !== "opening") return;
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    if (!dialog || !panel) return;
    if (!dialog.open) dialog.showModal();
    const card = target ? getCard(target.category, target.index) : null;
    if (!animated || !card) {
      dispatch({ type: "ready" });
      return;
    }
    // measuring also flushes styles, so the backdrop fades in once `show` is added
    const to = panel.getBoundingClientRect();
    const from = card.getBoundingClientRect();
    animation.current?.cancel();
    animation.current = panel.animate(
      [{ transform: rectTransform(from, to) }, { transform: "none" }],
      { duration: EXPAND_MS, easing: EXPAND_EASE },
    );
    dispatch({ type: "shown" });
  }, [stage, target, animated, dialogRef, panelRef, getCard, dispatch]);

  // shown: the content fades in just before the expand finishes
  useEffect(() => {
    if (stage !== "shown") return;
    const timer = window.setTimeout(() => dispatch({ type: "ready" }), READY_AT_MS);
    return () => window.clearTimeout(timer);
  }, [stage, dispatch]);

  // ready: focus the close button
  useEffect(() => {
    if (stage === "ready") closeButtonRef.current?.focus({ preventScroll: true });
  }, [stage, closeButtonRef]);

  // leaving: after a short pause the panel collapses back into its card
  useLayoutEffect(() => {
    if (stage !== "leaving") return;
    const panel = panelRef.current;
    const card = target ? getCard(target.category, target.index) : null;
    if (!animated || !panel || !card || !card.isConnected) {
      dispatch({ type: "finished" });
      return;
    }
    const to = panel.getBoundingClientRect();
    const from = card.getBoundingClientRect();
    const timer = window.setTimeout(() => {
      animation.current?.cancel();
      animation.current = panel.animate(
        [{ transform: "none" }, { transform: rectTransform(from, to) }],
        { duration: COLLAPSE_MS, easing: COLLAPSE_EASE, fill: "forwards" },
      );
      dispatch({ type: "exit" });
    }, COLLAPSE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [stage, target, animated, panelRef, getCard, dispatch]);

  // exiting: once collapsed, close the dialog
  useEffect(() => {
    if (stage !== "exiting") return;
    const timer = window.setTimeout(
      () => dispatch({ type: "finished" }),
      FINISH_AFTER_COLLAPSE_START_MS,
    );
    return () => window.clearTimeout(timer);
  }, [stage, dispatch]);

  // closed: close the native dialog and give the card its focus back
  useLayoutEffect(() => {
    if (stage !== "closed") return;
    animation.current?.cancel();
    animation.current = null;
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    dialog.close();
    if (target) getCard(target.category, target.index)?.focus({ preventScroll: true });
  }, [stage, target, dialogRef, getCard]);

  useEffect(
    () => () => {
      animation.current?.cancel();
    },
    [],
  );
}
