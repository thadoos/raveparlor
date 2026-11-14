import type { ReactNode } from "react";
import styles from "./DialogPrice.module.css";

interface PriceCellProps {
  /** Text on the button. */
  label: ReactNode;
  /** Whether the visitor is choosing: cells are only enabled then. */
  picking: boolean;
  /** False when the cell is not offered ("–"): it stays disabled while picking. Default true. */
  offered?: boolean;
  selected: boolean;
  onPick: () => void;
}

/** A price (or name) the visitor can pick. A real button, disabled until the dialog is picking. */
export function PriceCell({ label, picking, offered = true, selected, onPick }: PriceCellProps) {
  return (
    <button
      className={styles.cell}
      type="button"
      aria-pressed={selected}
      disabled={!picking || !offered}
      onClick={onPick}
    >
      {label}
    </button>
  );
}
