/** The booking picker: choosing a barber and/or a cut or hair length before continuing on WhatsApp. */

export interface Selection {
  /** The chosen barber; null for "No preference" (and for services without a barber choice). */
  barber: string | null;
  /** The chosen cut type or hair length, e.g. "Gentleman" or "Medium length". */
  cut: string | null;
  /** Index of the chosen row (barber) in the price area; "No preference" comes after the barbers. */
  row: number;
  /** Index of the chosen price column. */
  col: number;
}

export interface PickerState {
  /** True once the visitor pressed "Book now": details are hidden and the prices can be picked. */
  flipped: boolean;
  selection: Selection | null;
}

export type PickerAction =
  | { type: "flip" }
  | { type: "back" }
  | { type: "pick"; selection: Selection }
  | { type: "reset"; picking: boolean };

export function initialPickerState(picking: boolean): PickerState {
  return { flipped: picking, selection: null };
}

export function pickerReducer(state: PickerState, action: PickerAction): PickerState {
  switch (action.type) {
    case "flip":
      return { ...state, flipped: true };
    case "back":
      // going back keeps the selection
      return { ...state, flipped: false };
    case "pick":
      // price cells are only enabled while picking
      return state.flipped ? { ...state, selection: action.selection } : state;
    case "reset":
      return initialPickerState(action.picking);
  }
}

/** What pressing the "Book now" / "Continue on WhatsApp" button does. */
export type BookIntent = "flip" | "nudge" | "follow";

/**
 * The first press on a service with choices starts picking, continuing with nothing picked is
 * blocked (the price area nudges), anything else follows the WhatsApp link.
 */
export function bookIntent(state: PickerState, pickable: boolean): BookIntent {
  if (pickable && !state.flipped) return "flip";
  if (state.flipped && !state.selection) return "nudge";
  return "follow";
}
