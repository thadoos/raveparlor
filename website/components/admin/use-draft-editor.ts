"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { discardDraft, publishDraft, saveDraft } from "@/app/(admin)/admin/actions";
import { deepEqual, summarizeChanges } from "@/lib/admin/changes";
import { contentWarnings } from "@/lib/admin/warnings";
import type { ContentWarning } from "@/lib/admin/warnings";
import type { SiteContent } from "@/lib/content/schema";

export type EditorStatus = "idle" | "saving" | "publishing" | "error";

export interface EditorState {
  /** What the admin is editing now. */
  draft: SiteContent;
  /** The draft as last stored in the database. */
  saved: SiteContent;
  /** What's live. */
  published: SiteContent;
  status: EditorStatus;
  error: string | null;
}

export type EditorAction =
  | { type: "apply"; op: (c: SiteContent) => SiteContent }
  | { type: "saveStart" }
  | { type: "saved"; content: SiteContent }
  | { type: "saveFailed"; error: string }
  | { type: "publishStart" }
  | { type: "published"; content: SiteContent }
  | { type: "discarded"; content: SiteContent };

export function initialEditorState(initial: {
  draft: SiteContent;
  published: SiteContent;
}): EditorState {
  return {
    draft: initial.draft,
    saved: initial.draft,
    published: initial.published,
    status: "idle",
    error: null,
  };
}

/**
 * Pure state transitions. `saved` and `published` carry the content that was sent, not the current
 * draft, so edits made while a request is in flight stay unsaved. A failure never touches `draft`.
 */
export function draftEditorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "apply":
      return { ...state, draft: action.op(state.draft) };
    case "saveStart":
      return { ...state, status: "saving", error: null };
    case "saved":
      return { ...state, saved: action.content, status: "idle", error: null };
    case "saveFailed":
      return { ...state, status: "error", error: action.error };
    case "publishStart":
      return { ...state, status: "publishing", error: null };
    case "published":
      return {
        ...state,
        saved: action.content,
        published: action.content,
        status: "idle",
        error: null,
      };
    case "discarded":
      return {
        ...state,
        draft: action.content,
        saved: action.content,
        published: action.content,
        status: "idle",
        error: null,
      };
  }
}

const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";

export function useDraftEditor(initial: { draft: SiteContent; published: SiteContent }) {
  const [state, dispatch] = useReducer(draftEditorReducer, initial, initialEditorState);
  const { draft, saved, published, status, error } = state;
  const busy = status === "saving" || status === "publishing";

  const dirty = useMemo(() => !deepEqual(saved, draft), [saved, draft]);
  const changeCount = useMemo(() => summarizeChanges(saved, draft).length, [saved, draft]);
  const warnings: ContentWarning[] = useMemo(
    () => contentWarnings(published, draft),
    [published, draft],
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const apply = useCallback(
    (op: (c: SiteContent) => SiteContent) => dispatch({ type: "apply", op }),
    [],
  );

  const save = useCallback(async () => {
    if (busy) return;
    const content = draft;
    dispatch({ type: "saveStart" });
    try {
      const result = await saveDraft(content);
      dispatch(
        result.ok ? { type: "saved", content } : { type: "saveFailed", error: result.error },
      );
    } catch {
      dispatch({ type: "saveFailed", error: NETWORK_ERROR });
    }
  }, [busy, draft]);

  const publish = useCallback(async () => {
    if (busy) return;
    const content = draft;
    dispatch({ type: "publishStart" });
    try {
      const result = await publishDraft(content);
      dispatch(
        result.ok ? { type: "published", content } : { type: "saveFailed", error: result.error },
      );
    } catch {
      dispatch({ type: "saveFailed", error: NETWORK_ERROR });
    }
  }, [busy, draft]);

  const discard = useCallback(async () => {
    if (busy) return;
    // No separate status for discarding: it is a write, so it shows as saving.
    dispatch({ type: "saveStart" });
    try {
      const result = await discardDraft();
      if (result.ok && result.content) dispatch({ type: "discarded", content: result.content });
      else dispatch({ type: "saveFailed", error: result.ok ? NETWORK_ERROR : result.error });
    } catch {
      dispatch({ type: "saveFailed", error: NETWORK_ERROR });
    }
  }, [busy]);

  return {
    draft,
    saved,
    published,
    dirty,
    changeCount,
    status,
    error,
    warnings,
    apply,
    save,
    publish,
    discard,
  };
}

export type DraftEditor = ReturnType<typeof useDraftEditor>;
