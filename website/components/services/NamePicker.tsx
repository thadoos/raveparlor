import { Editable } from "@/components/edit/Editable";
import type { Selection } from "@/lib/booking/picker";
import { cx } from "@/lib/cx";
import { isPrice, type PriceRow } from "@/lib/data/services";
import styles from "./DialogPrice.module.css";
import { PriceCell } from "./PriceCell";

interface NamePickerProps {
  /** The barbers' rows of a service without options (one price each). */
  rows: readonly PriceRow[];
  picking: boolean;
  /**
   * The barbers' prices differ: the list shows outside the booking step too, with each price.
   * Otherwise the one price shows above and the list has names only.
   */
  listed: boolean;
  selection: Selection | null;
  onPick: (selection: Selection) => void;
}

interface NameProps {
  row: PriceRow;
}

/** A barber's name (an edit target in the admin preview). */
function Name({ row }: NameProps) {
  return row.barberId ? (
    <Editable target={{ kind: "barber", id: row.barberId }}>{row.label}</Editable>
  ) : (
    row.label
  );
}

/**
 * For a service without options and a barber choice: each barber, with their price when the
 * barbers' prices differ. A barber who doesn't offer the service ("–") can't be picked.
 */
export function NamePicker({ rows, picking, listed, selection, onPick }: NamePickerProps) {
  return (
    <div className={cx(styles.who, picking && styles.isPicking, listed && styles.isListed)}>
      {rows.map((row, r) => (
        <PriceCell
          key={row.barberId ?? r}
          label={
            listed ? (
              <>
                <Name row={row} /> · {row.prices[0] ?? "–"}
              </>
            ) : (
              <Name row={row} />
            )
          }
          picking={picking}
          offered={isPrice(row.prices[0])}
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
