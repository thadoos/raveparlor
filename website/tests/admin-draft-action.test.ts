import { afterEach, describe, expect, it, vi } from "vitest";
import { ACTION_FAILED, SESSION_EXPIRED, runDraftAction } from "@/lib/admin/draft-action";

const ADMIN = { userId: "u1", email: "a@example.com" };

afterEach(() => vi.restoreAllMocks());

describe("runDraftAction", () => {
  it("returns the session-expired result without running the action when there's no admin", async () => {
    const action = vi.fn(async () => ({ ok: true as const }));
    const result = await runDraftAction("save", async () => null, action);
    expect(result).toEqual({
      ok: false,
      error: "Your session has expired. Sign in again in another tab, then save.",
    });
    expect(result).toEqual({ ok: false, error: SESSION_EXPIRED });
    expect(action).not.toHaveBeenCalled();
  });

  it("runs the action for an admin and passes its result through", async () => {
    const result = await runDraftAction(
      "publish",
      async () => ADMIN,
      async (admin) => ({ ok: true as const, publishedAt: admin.userId }),
    );
    expect(result).toEqual({ ok: true, publishedAt: "u1" });
  });

  it("turns a failed admin check into a fixed error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await runDraftAction(
      "save",
      async () => {
        throw new Error("Admin check failed: boom");
      },
      async () => ({ ok: true as const }),
    );
    expect(result).toEqual({ ok: false, error: ACTION_FAILED });
    expect(console.error).toHaveBeenCalled();
  });

  it("turns an unexpected error in the action into a fixed error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await runDraftAction(
      "discard",
      async () => ADMIN,
      async () => {
        throw new Error("db exploded");
      },
    );
    expect(result).toEqual({ ok: false, error: ACTION_FAILED });
  });
});
