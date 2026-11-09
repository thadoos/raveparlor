import { describe, expect, it } from "vitest";
import {
  bookIntent,
  initialPickerState,
  pickerReducer,
  type PickerState,
  type Selection,
} from "@/lib/booking/picker";

const selection: Selection = { barber: "John", cut: "Ladies", row: 1, col: 1 };

describe("pickerReducer", () => {
  it("starts closed, or already picking", () => {
    expect(initialPickerState(false)).toEqual({ flipped: false, selection: null });
    expect(initialPickerState(true)).toEqual({ flipped: true, selection: null });
  });

  it("flips to the picking step", () => {
    expect(pickerReducer(initialPickerState(false), { type: "flip" }).flipped).toBe(true);
  });

  it("keeps the selection when going back", () => {
    const picked: PickerState = { flipped: true, selection };
    expect(pickerReducer(picked, { type: "back" })).toEqual({ flipped: false, selection });
    expect(pickerReducer(pickerReducer(picked, { type: "back" }), { type: "flip" })).toEqual(
      picked,
    );
  });

  it("picks a single selection, replacing the previous one", () => {
    const first = pickerReducer(initialPickerState(true), { type: "pick", selection });
    expect(first.selection).toEqual(selection);
    const other: Selection = { barber: null, cut: "Gentleman", row: 3, col: 0 };
    expect(pickerReducer(first, { type: "pick", selection: other }).selection).toEqual(other);
  });

  it("ignores picks while not picking", () => {
    const state = initialPickerState(false);
    expect(pickerReducer(state, { type: "pick", selection })).toBe(state);
  });

  it("resets the selection and the step", () => {
    const picked: PickerState = { flipped: true, selection };
    expect(pickerReducer(picked, { type: "reset", picking: false })).toEqual({
      flipped: false,
      selection: null,
    });
    expect(pickerReducer(picked, { type: "reset", picking: true })).toEqual({
      flipped: true,
      selection: null,
    });
  });
});

describe("bookIntent", () => {
  it("flips on the first press of a service with choices", () => {
    expect(bookIntent(initialPickerState(false), true)).toBe("flip");
  });

  it("follows the link straight away for a service without choices", () => {
    expect(bookIntent(initialPickerState(false), false)).toBe("follow");
  });

  it("blocks continuing with nothing picked", () => {
    expect(bookIntent(initialPickerState(true), true)).toBe("nudge");
  });

  it("follows the link once something is picked", () => {
    expect(bookIntent({ flipped: true, selection }, true)).toBe("follow");
  });
});
