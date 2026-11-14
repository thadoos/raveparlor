import type { ReactNode } from "react";
import { Editable } from "@/components/edit/Editable";
import type { Selection } from "@/lib/booking/picker";
import { cx } from "@/lib/cx";
import {
  cutLabel,
  isPickable,
  isPrice,
  minPriceForColumn,
  type MenuItem,
  type PriceRow,
} from "@/lib/data/services";
import styles from "./DialogPrice.module.css";
import { PriceCell } from "./PriceCell";

interface PriceTableProps {
  item: MenuItem;
  picking: boolean;
  selection: Selection | null;
  onPick: (selection: Selection) => void;
}

interface RowLabelProps {
  row: PriceRow;
}

/** A barber's name and days (an edit target in the admin preview). */
function RowLabel({ row }: RowLabelProps): ReactNode {
  const label = (
    <>
      {row.label}
      {row.sub && <small>{row.sub}</small>}
    </>
  );
  return row.barberId ? (
    <Editable target={{ kind: "barber", id: row.barberId }}>{label}</Editable>
  ) : (
    label
  );
}

/**
 * The price table of a service with options. With a barber choice it has a row per barber (plus a
 * "No preference" row showing the lowest price per option while picking); when every barber charges
 * the same, the details show one unlabelled row and the full table appears while picking. Prices
 * become buttons while picking.
 */
export function PriceTable({ item, picking, selection, onPick }: PriceTableProps) {
  const cols = item.options;
  const hasRows = item.byBarber && (picking || !item.collapsed);
  const rows = hasRows ? item.rows : item.rows.slice(0, 1);
  const anyRow = hasRows ? rows.length : null;
  // a single row is pickable per option when there is no barber choice
  const optionCells = !item.byBarber && isPickable(item);
  const className = cx(
    hasRows && styles.hasRows,
    picking && styles.isPicking,
    selection && styles.hasSel,
  );

  function isSelected(row: number, col: number): boolean {
    return selection?.row === row && selection.col === col;
  }

  function pick(row: PriceRow, r: number, c: number) {
    onPick({ barberId: row.barberId, cut: cutLabel(cols, c), row: r, col: c });
  }

  return (
    <table className={className || undefined}>
      <thead>
        <tr>
          {hasRows && <th />}
          {cols.map((col, c) => (
            <th key={col} className={selection?.col === c ? styles.isOn : undefined}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={row.barberId ?? r} className={selection?.row === r ? styles.isOn : undefined}>
            {hasRows && (
              <th scope="row">
                <RowLabel row={row} />
              </th>
            )}
            {row.prices.map((price, c) => (
              <td key={cols[c] ?? c}>
                {hasRows || (optionCells && isPrice(price)) ? (
                  <PriceCell
                    label={price}
                    picking={picking}
                    selected={isSelected(r, c)}
                    onPick={() => pick(row, r, c)}
                  />
                ) : (
                  price
                )}
              </td>
            ))}
          </tr>
        ))}
        {anyRow !== null && (
          <tr className={cx(styles.any, selection?.row === anyRow && styles.isOn)}>
            <th scope="row">No preference</th>
            {cols.map((col, c) => {
              const min = minPriceForColumn(item, c);
              return (
                <td key={col}>
                  <PriceCell
                    label={min === null ? "–" : `from £${min}`}
                    picking={picking}
                    selected={isSelected(anyRow, c)}
                    onPick={() =>
                      onPick({ barberId: null, cut: cutLabel(cols, c), row: anyRow, col: c })
                    }
                  />
                </td>
              );
            })}
          </tr>
        )}
      </tbody>
    </table>
  );
}
