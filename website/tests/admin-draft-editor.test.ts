import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import type { SiteContent } from "@/lib/content/schema";

vi.mock("@/app/(admin)/admin/actions", () => ({}));

const { draftEditorReducer, initialEditorState } =
  await import("@/components/admin/use-draft-editor");

function edited(): SiteContent {
  const c = structuredClone(DEFAULT_CONTENT);
  c.sharedNotes.chemical = "Edited";
  return c;
}

function dirtyState() {
  const state = initialEditorState({ draft: DEFAULT_CONTENT, published: DEFAULT_CONTENT });
  return draftEditorReducer(state, { type: "apply", op: () => edited() });
}

describe("draftEditorReducer", () => {
  it("apply replaces the draft with the op's result", () => {
    const state = dirtyState();
    expect(state.draft.sharedNotes.chemical).toBe("Edited");
    expect(state.saved).toBe(DEFAULT_CONTENT);
  });

  it("saveFailed keeps the draft and sets the error", () => {
    const before = draftEditorReducer(dirtyState(), { type: "saveStart" });
    const after = draftEditorReducer(before, { type: "saveFailed", error: "Nope" });
    expect(after.draft).toBe(before.draft);
    expect(after.saved).toBe(before.saved);
    expect(after.status).toBe("error");
    expect(after.error).toBe("Nope");
  });

  it("saved sets saved to the saved draft", () => {
    const before = draftEditorReducer(dirtyState(), { type: "saveStart" });
    const after = draftEditorReducer(before, { type: "saved", content: before.draft });
    expect(after.saved).toBe(before.draft);
    expect(after.draft).toBe(before.draft);
    expect(after.status).toBe("idle");
    expect(after.error).toBeNull();
  });

  it("saved keeps edits made while the save was in flight", () => {
    const sent = dirtyState();
    const later = draftEditorReducer(sent, {
      type: "apply",
      op: (c) => ({ ...c, sharedNotes: { chemical: "Later" } }),
    });
    const after = draftEditorReducer(later, { type: "saved", content: sent.draft });
    expect(after.saved).toBe(sent.draft);
    expect(after.draft.sharedNotes.chemical).toBe("Later");
  });

  it("published updates both saved and published", () => {
    const state = dirtyState();
    const after = draftEditorReducer(state, { type: "published", content: state.draft });
    expect(after.saved).toBe(state.draft);
    expect(after.published).toBe(state.draft);
  });

  it("discarded resets draft, saved and published", () => {
    const after = draftEditorReducer(dirtyState(), { type: "discarded", content: DEFAULT_CONTENT });
    expect(after.draft).toBe(DEFAULT_CONTENT);
    expect(after.saved).toBe(DEFAULT_CONTENT);
    expect(after.published).toBe(DEFAULT_CONTENT);
  });
});
