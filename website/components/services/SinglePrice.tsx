import type { Selection } from "@/lib/booking/picker";
import type { MenuItem } from "@/lib/data/services";
import styles from "./DialogPrice.module.css";
import { NamePicker } from "./NamePicker";

interface SinglePriceProps {
  item: MenuItem;
  picking: boolean;
  selection: Selection | null;
  onPick: (selection: Selection) => void;
}

/**
 * A service without options: one price, or with a barber choice the barbers and their prices. When
 * every barber charges the same, the details show the one price and the barbers appear while picking.
 */
export function SinglePrice({ item, picking, selection, onPick }: SinglePriceProps) {
  const listed = item.byBarber && !item.collapsed;
  return (
    <>
      {!listed && <div className={styles.one}>{item.rows.at(0)?.prices[0]}</div>}
      {item.byBarber && (
        <NamePicker
          rows={item.rows}
          picking={picking}
          listed={listed}
          selection={selection}
          onPick={onPick}
        />
      )}
    </>
  );
}
