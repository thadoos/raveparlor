import styles from "./DialogPrice.module.css";

interface PriceCellProps {
  /** Text on the button. */
  label: string;
  /** Whether the visitor is choosing: cells are only enabled then. */
  picking: boolean;
  selected: boolean;
  onPick: () => void;
}

/** A price (or name) the visitor can pick. A real button, disabled until the dialog is picking. */
export function PriceCell({ label, picking, selected, onPick }: PriceCellProps) {
  return (
    <button
      className={styles.cell}
      type="button"
      aria-pressed={selected}
      disabled={!picking}
      onClick={onPick}
    >
      {label}
    </button>
  );
}
