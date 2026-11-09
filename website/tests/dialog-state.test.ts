import { describe, expect, it } from "vitest";
import {
  INITIAL_DIALOG_STATE,
  dialogReducer,
  isShown,
  type DialogAction,
  type DialogState,
  type DialogTarget,
} from "@/components/services/dialog-state";
import { rectTransform } from "@/lib/rect-transform";

const target: DialogTarget = { category: "cut", index: 0, picking: false };

function run(actions: DialogAction[], from: DialogState = INITIAL_DIALOG_STATE): DialogState {
  return actions.reduce(dialogReducer, from);
}

describe("dialogReducer", () => {
  it("goes through the open and close stages in order", () => {
    const open: DialogAction = { type: "open", target, animated: true };
    expect(run([open]).stage).toBe("opening");
    expect(run([open, { type: "shown" }]).stage).toBe("shown");
    expect(run([open, { type: "shown" }, { type: "ready" }]).stage).toBe("ready");
    expect(run([open, { type: "shown" }, { type: "ready" }, { type: "close" }]).stage).toBe(
      "leaving",
    );
    expect(
      run([open, { type: "shown" }, { type: "ready" }, { type: "close" }, { type: "exit" }]).stage,
    ).toBe("exiting");
    expect(
      run([
        open,
        { type: "shown" },
        { type: "ready" },
        { type: "close" },
        { type: "exit" },
        { type: "finished" },
      ]).stage,
    ).toBe("closed");
  });

  it("can skip straight to ready (reduced motion) and finish without animating", () => {
    const state = run([
      { type: "open", target, animated: false },
      { type: "ready" },
      { type: "close" },
      { type: "finished" },
    ]);
    expect(state.stage).toBe("closed");
  });

  it("ignores input while busy", () => {
    const opening = run([{ type: "open", target, animated: true }]);
    expect(dialogReducer(opening, { type: "close" })).toBe(opening);
    expect(dialogReducer(opening, { type: "open", target, animated: true })).toBe(opening);
    const leaving = run([{ type: "ready" }, { type: "close" }], opening);
    expect(leaving.stage).toBe("leaving");
    expect(dialogReducer(leaving, { type: "open", target, animated: true })).toBe(leaving);
    expect(dialogReducer(leaving, { type: "close" })).toBe(leaving);
  });

  it("does nothing when closed", () => {
    expect(dialogReducer(INITIAL_DIALOG_STATE, { type: "close" })).toBe(INITIAL_DIALOG_STATE);
    expect(dialogReducer(INITIAL_DIALOG_STATE, { type: "ready" })).toBe(INITIAL_DIALOG_STATE);
  });

  it("counts opens and keeps the target after closing", () => {
    const closed = run([
      { type: "open", target, animated: true },
      { type: "ready" },
      { type: "close" },
      { type: "finished" },
    ]);
    expect(closed.openId).toBe(1);
    expect(closed.target).toEqual(target);
    const next: DialogTarget = { category: "perm", index: 2, picking: true };
    expect(dialogReducer(closed, { type: "open", target: next, animated: true })).toMatchObject({
      openId: 2,
      target: next,
    });
  });

  it("has the show class from shown until the collapse starts", () => {
    expect(
      (["closed", "opening", "shown", "ready", "leaving", "exiting"] as const).map(isShown),
    ).toEqual([false, false, true, true, true, false]);
  });
});

describe("rectTransform", () => {
  it("moves and scales the panel's rectangle onto the card's", () => {
    const card = { left: 100, top: 50, width: 200, height: 100 };
    const panel = { left: 40, top: 20, width: 800, height: 400 };
    expect(rectTransform(card, panel)).toBe("translate(60px,30px) scale(0.25,0.25)");
  });
});
