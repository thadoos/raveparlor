import type { Selection } from "@/lib/booking/picker";
import { cx } from "@/lib/cx";
import type { PriceRow } from "@/lib/data/services";
import styles from "./DialogPrice.module.css";
import { PriceCell } from "./PriceCell";

interface NamePickerProps {
  /** The barbers' rows of a service without options (one price each). */
  rows: readonly PriceRow[];
  picking: boolean;
  /** Show the list outside the booking step too (when the barbers' prices differ). */
  listed: boolean;
  selection: Selection | null;
  onPick: (selection: Selection) => void;
}

/** For a service without options and a barber choice: each barber with their price. */
export function NamePicker({ rows, picking, listed, selection, onPick }: NamePickerProps) {
  return (
    <div className={cx(styles.who, picking && styles.isPicking, listed && styles.isListed)}>
      {rows.map((row, r) => (
        <PriceCell
          key={row.barberId ?? r}
          label={`${row.label} · ${row.prices[0] ?? "–"}`}
          picking={picking}
          selected={selection?.row === r}
          onPick={() => onPick({ barberId: row.barberId, cut: null, row: r, col: 0 })}
        />
      ))}
      <PriceCell
        label="No preference"
        picking={picking}
        selected={selection?.row === rows.length}
        onPick={() => onPick({ barberId: null, cut: null, row: rows.length, col: 0 })}
      />
    </div>
  );
}
