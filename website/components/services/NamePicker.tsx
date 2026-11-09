import type { Selection } from "@/lib/booking/picker";
import type { Barber } from "@/lib/data/services";
import { PriceCell } from "./PriceCell";

interface NamePickerProps {
  barbers: readonly Barber[];
  picking: boolean;
  selection: Selection | null;
  onPick: (selection: Selection) => void;
}

/** For a single-price service with a barber choice: just the names, shown while picking. */
export function NamePicker({ barbers, picking, selection, onPick }: NamePickerProps) {
  return (
    <div className={picking ? "md-who is-picking" : "md-who"}>
      {barbers.map((barber, row) => (
        <PriceCell
          key={barber.name}
          label={barber.name}
          picking={picking}
          selected={selection?.row === row}
          onPick={() => onPick({ barber: barber.name, cut: null, row, col: 0 })}
        />
      ))}
      <PriceCell
        label="No preference"
        picking={picking}
        selected={selection?.row === barbers.length}
        onPick={() => onPick({ barber: null, cut: null, row: barbers.length, col: 0 })}
      />
    </div>
  );
}
