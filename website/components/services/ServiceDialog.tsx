"use client";

import { useRef } from "react";
import { cx } from "@/lib/cx";
import { useModalLock } from "@/lib/hooks/use-modal-lock";
import { isShown } from "./dialog-state";
import { ServiceDialogContent } from "./ServiceDialogContent";
import { useServiceDialog } from "./services-context";
import { useDialogMotion } from "./use-dialog-motion";
import styles from "./ServiceDialog.module.css";

/**
 * The service details: a native modal `<dialog>` (focus trap, top layer) whose panel expands out
 * of the clicked card and collapses back into it. Escape, the backdrop and the X button all run
 * the animated close. `show` and `ready` mirror the dialog's stage (see `dialog-state.ts`).
 */
export function ServiceDialog() {
  const { state, close } = useServiceDialog();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { stage, target, openId } = state;

  // the page behind stops scrolling and the deck stands down while the dialog is open
  useModalLock(stage !== "closed");
  useDialogMotion(state, dialogRef, panelRef, closeRef);

  return (
    <dialog
      ref={dialogRef}
      className={cx(
        styles.dialog,
        isShown(stage) && styles.show,
        stage === "ready" && styles.ready,
      )}
      id="md"
      data-tone-ignore
      aria-labelledby="md-name"
      onCancel={(e) => {
        // Escape: run the animated close instead of closing at once
        e.preventDefault();
        close();
      }}
    >
      <div className={styles.backdrop} data-close onClick={close}></div>
      <div className={styles.panel} id="md-panel" ref={panelRef}>
        <button
          ref={closeRef}
          className={styles.close}
          type="button"
          aria-label="Close"
          data-close
          onClick={close}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5l14 14M19 5 5 19"></path>
          </svg>
        </button>
        {target && <ServiceDialogContent key={openId} target={target} />}
      </div>
    </dialog>
  );
}
