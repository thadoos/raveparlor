"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DraftBar } from "@/components/admin/DraftBar";
import type { EditorMode } from "@/components/admin/DraftBar";
import { FormMode } from "@/components/admin/FormMode";
import { useDraftEditor } from "@/components/admin/use-draft-editor";
import type { SiteContent } from "@/lib/content/schema";
import styles from "./AdminApp.module.css";

interface AdminAppProps {
  initial: { draft: SiteContent; published: SiteContent };
}

const MODE_KEY = "admin.mode";
const modeListeners = new Set<() => void>();

function readMode(): EditorMode {
  try {
    return window.localStorage.getItem(MODE_KEY) === "visual" ? "visual" : "form";
  } catch {
    return "form";
  }
}

function writeMode(mode: EditorMode): void {
  try {
    window.localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Storage blocked (private mode, policy): the choice just isn't remembered.
  }
  for (const listener of modeListeners) listener();
}

function subscribeMode(listener: () => void): () => void {
  modeListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    modeListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/**
 * The remembered editor mode. An external store rather than state, so the server render and
 * hydration use "form" and the stored value takes over right after, with no mismatch.
 */
function useEditorMode(): [EditorMode, (mode: EditorMode) => void] {
  const mode = useSyncExternalStore(subscribeMode, readMode, () => "form" as const);
  return [mode, useCallback((next: EditorMode) => writeMode(next), [])];
}

/** The admin editor: the draft bar plus the form or visual editing area. */
export function AdminApp({ initial }: AdminAppProps) {
  const editor = useDraftEditor(initial);
  const [mode, setMode] = useEditorMode();

  return (
    <div className={styles.app}>
      <DraftBar editor={editor} mode={mode} onModeChange={setMode} />
      <main className={styles.main}>
        {mode === "form" ? (
          <FormMode draft={editor.draft} apply={editor.apply} />
        ) : (
          <p className="admin-label">Visual editor coming soon.</p>
        )}
      </main>
    </div>
  );
}
