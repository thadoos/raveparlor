import type { Selection } from "@/lib/booking/picker";
import {
  cutLabel,
  hasChoices,
  isPrice,
  minPriceForColumn,
  type MenuCategory,
  type MenuItem,
} from "@/lib/data/services";
import { PriceCell } from "./PriceCell";

interface PriceTableProps {
  item: MenuItem;
  category: MenuCategory;
  picking: boolean;
  selection: Selection | null;
  onPick: (selection: Selection) => void;
}

/**
 * The price table of a service with price columns. While picking, its prices become buttons: per
 * barber (plus a "No preference" row showing the lowest price per column) or per hair length.
 */
export function PriceTable({ item, category, picking, selection, onPick }: PriceTableProps) {
  const cols = item.cols ?? [];
  const hasRows = !!item.rows;
  const rows = item.rows ?? [{ label: "", sub: "", prices: item.prices ?? [] }];
  const anyRow = category.barbers && item.rows ? item.rows.length : null;
  const className = [hasRows && "has-rows", picking && "is-picking", selection && "has-sel"]
    .filter(Boolean)
    .join(" ");

  function isSelected(row: number, col: number): boolean {
    return selection?.row === row && selection.col === col;
  }

  return (
    <table className={className || undefined}>
      <thead>
        <tr>
          {hasRows && <th />}
          {cols.map((col, c) => (
            <th key={col} className={selection?.col === c ? "is-on" : undefined}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={row.label || r} className={selection?.row === r ? "is-on" : undefined}>
            {hasRows && (
              <th scope="row">
                {row.label}
                {row.sub && <small>{row.sub}</small>}
              </th>
            )}
            {row.prices.map((price, c) => (
              <td key={cols[c]}>
                {hasRows ? (
                  <PriceCell
                    label={price}
                    picking={picking}
                    selected={isSelected(r, c)}
                    onPick={() => onPick({ barber: row.label, cut: cols[c], row: r, col: c })}
                  />
                ) : hasChoices(item) && isPrice(price) ? (
                  <PriceCell
                    label={price}
                    picking={picking}
                    selected={isSelected(r, c)}
                    onPick={() => onPick({ barber: null, cut: cutLabel(cols, c), row: r, col: c })}
                  />
                ) : (
                  price
                )}
              </td>
            ))}
          </tr>
        ))}
        {anyRow !== null && (
          <tr className={selection?.row === anyRow ? "md-any is-on" : "md-any"}>
            <th scope="row">No preference</th>
            {cols.map((col, c) => {
              const min = minPriceForColumn(item, c);
              return (
                <td key={col}>
                  <PriceCell
                    label={min === null ? "–" : `from £${min}`}
                    picking={picking}
                    selected={isSelected(anyRow, c)}
                    onPick={() => onPick({ barber: null, cut: col, row: anyRow, col: c })}
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
