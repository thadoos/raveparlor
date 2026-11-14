"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  confirmLabel: string;
  onConfirm: () => void;
  /** Called on Cancel, Escape, or any other close that isn't a confirm. */
  onCancel: () => void;
  children?: ReactNode;
}

/** Modal confirmation on the native <dialog>: focus trap, Escape and inert background come free.
 *  Cancel takes focus, so a stray Enter never confirms. */
export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {children ? <div className={styles.body}>{children}</div> : null}
      <div className={styles.actions}>
        <button
          type="button"
          className={`admin-button ${styles.secondary}`}
          onClick={onCancel}
          autoFocus
        >
          Cancel
        </button>
        <button type="button" className="admin-button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
