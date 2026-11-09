import type { CategoryKey } from "@/lib/data/services";

/**
 * Lifecycle of the service dialog. Each stage maps to the state classes on `.md`:
 *
 * - `closed`: not open
 * - `opening`: open, panel still at the card's rectangle, no `show` yet
 * - `shown`: `show` (backdrop fades in, panel expands)
 * - `ready`: `show` + `ready` (content faded in; the only stage that can be closed)
 * - `leaving`: `ready` removed, waiting to collapse
 * - `exiting`: `show` removed, panel collapsing back to the card
 */
export type DialogStage = "closed" | "opening" | "shown" | "ready" | "leaving" | "exiting";

export interface DialogTarget {
  category: CategoryKey;
  /** Index of the service within the category. */
  index: number;
  /** Open straight into the booking step (price area picking). */
  picking: boolean;
}

export interface DialogState {
  stage: DialogStage;
  /** The service shown; kept after closing so the content stays while the panel collapses. */
  target: DialogTarget | null;
  /** Changes on every open, so per-open state (the selection) starts fresh. */
  openId: number;
  /** Animate the panel out of the card (false for reduced motion). */
  animated: boolean;
}

export type DialogAction =
  | { type: "open"; target: DialogTarget; animated: boolean }
  | { type: "shown" }
  | { type: "ready" }
  | { type: "close" }
  | { type: "exit" }
  | { type: "finished" };

export const INITIAL_DIALOG_STATE: DialogState = {
  stage: "closed",
  target: null,
  openId: 0,
  animated: false,
};

/** Stages with the `show` class (backdrop visible). */
export function isShown(stage: DialogStage): boolean {
  return stage === "shown" || stage === "ready" || stage === "leaving";
}

/**
 * Opening needs the dialog to be closed and closing needs it to be `ready`, so input is ignored
 * while it animates (the old "busy" flag).
 */
export function dialogReducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case "open":
      if (state.stage !== "closed") return state;
      return {
        stage: "opening",
        target: action.target,
        openId: state.openId + 1,
        animated: action.animated,
      };
    case "shown":
      return state.stage === "opening" ? { ...state, stage: "shown" } : state;
    case "ready":
      return state.stage === "opening" || state.stage === "shown"
        ? { ...state, stage: "ready" }
        : state;
    case "close":
      return state.stage === "ready" ? { ...state, stage: "leaving" } : state;
    case "exit":
      return state.stage === "leaving" ? { ...state, stage: "exiting" } : state;
    case "finished":
      return state.stage === "leaving" || state.stage === "exiting"
        ? { ...state, stage: "closed" }
        : state;
  }
}
