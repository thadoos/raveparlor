"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { signOut } from "@/app/(admin)/admin/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { DraftEditor } from "@/components/admin/use-draft-editor";
import { deepEqual, summarizeChanges } from "@/lib/admin/changes";
import styles from "./DraftBar.module.css";

export type EditorMode = "form" | "visual";

interface DraftBarProps {
  editor: DraftEditor;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

const MODES: { value: EditorMode; label: string }[] = [
  { value: "form", label: "Form" },
  { value: "visual", label: "Visual" },
];

const DISCARD_MESSAGE = "Throw away all draft changes and go back to what's live?";
const LEAVE_MESSAGE = "You have unsaved changes. Leave anyway?";
const PASSWORD_PATH = "/admin/password";

type Confirming = "publish" | "discard" | "password" | "signOut";

function statusText(dirty: boolean, changeCount: number, differsFromLive: boolean): string {
  if (dirty) return changeCount > 0 ? `Unsaved changes (${changeCount})` : "Unsaved changes";
  return differsFromLive ? "Draft differs from live" : "Up to date";
}

/** Sticky save/publish/discard bar: bottom of the screen on phones, top from 820px. */
export function DraftBar({ editor, mode, onModeChange }: DraftBarProps) {
  const {
    draft,
    saved,
    published,
    dirty,
    changeCount,
    status,
    error,
    warnings,
    save,
    publish,
    discard,
  } = editor;
  const router = useRouter();
  const [confirming, setConfirming] = useState<Confirming | null>(null);

  const differsFromLive = useMemo(() => !deepEqual(saved, published), [saved, published]);
  const publishLines = useMemo(
    () => (confirming === "publish" ? summarizeChanges(published, draft) : []),
    [confirming, published, draft],
  );

  const busy = status === "saving" || status === "publishing";
  const hasChanges = dirty || differsFromLive;

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.row}>
          <div className={styles.modes} role="group" aria-label="Editor mode">
            {MODES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={styles.mode}
                aria-pressed={mode === value}
                onClick={() => onModeChange(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className={styles.status} aria-live="polite">
            {status === "saving"
              ? "Saving…"
              : status === "publishing"
                ? "Publishing…"
                : statusText(dirty, changeCount, differsFromLive)}
          </p>
          <details className={styles.menu}>
            <summary className={styles.menuButton} aria-label="Account menu">
              <span aria-hidden="true">•••</span>
            </summary>
            <div className={styles.menuPanel}>
              {/* In-app navigation skips beforeunload, so both exits confirm while there are unsaved edits. */}
              <Link
                href={PASSWORD_PATH}
                className={styles.menuItem}
                onClick={(event) => {
                  const newTab = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
                  if (!dirty || newTab) return;
                  event.preventDefault();
                  setConfirming("password");
                }}
              >
                Change password
              </Link>
              <form
                action={signOut}
                onSubmit={(event) => {
                  if (!dirty) return;
                  event.preventDefault();
                  setConfirming("signOut");
                }}
              >
                <button type="submit" className={styles.menuItem}>
                  Sign out
                </button>
              </form>
            </div>
          </details>
        </div>
        <div className={styles.row}>
          <button
            type="button"
            className={`admin-button ${styles.action} ${styles.secondary}`}
            disabled={busy || !hasChanges}
            onClick={() => setConfirming("discard")}
          >
            Discard
          </button>
          <button
            type="button"
            className={`admin-button ${styles.action} ${styles.secondary}`}
            disabled={busy || !dirty}
            onClick={() => void save()}
          >
            Save
          </button>
          <button
            type="button"
            className={`admin-button ${styles.action}`}
            disabled={busy || !hasChanges}
            onClick={() => setConfirming("publish")}
          >
            Publish
          </button>
        </div>
        {error ? (
          <p className="admin-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirming === "publish"}
        title="Publish these changes?"
        confirmLabel="Publish"
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          void publish();
        }}
      >
        {publishLines.length > 0 ? (
          <ul className={styles.list}>
            {publishLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p>The draft matches what&apos;s live.</p>
        )}
        {warnings.length > 0 ? (
          <ul className={styles.warnings}>
            {warnings.map((warning) => (
              <li key={warning.message}>{warning.message}</li>
            ))}
          </ul>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirming === "discard"}
        title={DISCARD_MESSAGE}
        confirmLabel="Discard"
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          void discard();
        }}
      />

      <ConfirmDialog
        open={confirming === "password" || confirming === "signOut"}
        title={LEAVE_MESSAGE}
        confirmLabel="Leave"
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          const target = confirming;
          setConfirming(null);
          if (target === "password") router.push(PASSWORD_PATH);
          else void signOut();
        }}
      />
    </div>
  );
}
