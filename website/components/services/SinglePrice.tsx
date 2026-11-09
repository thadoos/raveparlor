import type { Selection } from "@/lib/booking/picker";
import type { MenuCategory, MenuItem } from "@/lib/data/services";
import styles from "./DialogPrice.module.css";
import { NamePicker } from "./NamePicker";

interface SinglePriceProps {
  item: MenuItem;
  category: MenuCategory;
  picking: boolean;
  selection: Selection | null;
  onPick: (selection: Selection) => void;
}

/** A service with one price or range; a barber choice (names only) when the category has barbers. */
export function SinglePrice({ item, category, picking, selection, onPick }: SinglePriceProps) {
  return (
    <>
      <div className={styles.one}>{item.range}</div>
      {category.barbers && (
        <NamePicker
          barbers={category.barbers}
          picking={picking}
          selection={selection}
          onPick={onPick}
        />
      )}
    </>
  );
}
