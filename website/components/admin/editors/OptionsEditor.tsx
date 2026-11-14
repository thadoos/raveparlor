"use client";

import { useId, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { setOptions } from "@/lib/admin/draft-ops";
import {
  addOption,
  moveOption,
  optionHasPrice,
  optionLabelError,
  removeOption,
  renameOption,
} from "@/lib/admin/option-edits";
import type { OptionEdit } from "@/lib/admin/option-edits";
import type { CategoryKey } from "@/lib/content/schema";
import type { EditorProps } from "./types";
import shared from "./Editor.module.css";
import fields from "./fields.module.css";
import styles from "./OptionsEditor.module.css";

interface OptionsEditorProps extends EditorProps {
  category: CategoryKey;
  item: string;
}

/**
 * A service's options (e.g. hair lengths), each a price column: rename inline, reorder, remove and
 * add. Labels are edited locally and committed on blur or Enter, so typing never fights the draft.
 */
export function OptionsEditor({ draft, apply, category, item }: OptionsEditorProps) {
  const labelId = useId();
  const [removing, setRemoving] = useState<number | null>(null);
  const data = draft.services[category].items[item];
  const options = data.options;

  // Edits are built from the options at apply time, so an edit queued right behind another (a
  // rename committed on blur, then the click that caused the blur) never undoes it.
  const commit = (edit: (current: readonly string[]) => OptionEdit) =>
    apply((c) => {
      const items = c.services[category].items;
      if (!Object.hasOwn(items, item)) return c;
      const next = edit(items[item].options);
      return setOptions(c, category, item, next.options, next.mapping);
    });

  function remove(index: number) {
    if (optionHasPrice(data, index)) setRemoving(index);
    else commit((o) => removeOption(o, index));
  }

  return (
    <div className={styles.editor} role="group" aria-labelledby={labelId}>
      <p id={labelId} className="admin-label">
        Options
      </p>
      {options.length === 0 ? (
        <p className={shared.note}>No options: the service has a single price.</p>
      ) : (
        <ol className={styles.list}>
          {options.map((option, index) => (
            <li key={index} className={styles.chip}>
              <OptionLabel
                value={option}
                index={index}
                validate={(label) => optionLabelError(options, label, index)}
                onCommit={(label) => commit((o) => renameOption(o, index, label))}
              />
              <button
                type="button"
                className={styles.iconButton}
                aria-label={`Move ${option} up`}
                disabled={index === 0}
                onClick={() => commit((o) => moveOption(o, index, index - 1))}
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.iconButton}
                aria-label={`Move ${option} down`}
                disabled={index === options.length - 1}
                onClick={() => commit((o) => moveOption(o, index, index + 1))}
              >
                ↓
              </button>
              <button
                type="button"
                className={styles.iconButton}
                aria-label={`Remove ${option}`}
                onClick={() => remove(index)}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      )}

      <AddOption
        validate={(label) => optionLabelError(options, label)}
        onAdd={(label) => commit((o) => addOption(o, label))}
      />

      <ConfirmDialog
        open={removing !== null}
        title={`Remove ${removing === null ? "this option" : (options.at(removing) ?? "this option")}?`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (removing !== null) {
            const index = removing;
            commit((o) => removeOption(o, index));
          }
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      >
        Its prices are removed too.
      </ConfirmDialog>
    </div>
  );
}

interface OptionLabelProps {
  value: string;
  index: number;
  validate: (label: string) => string | null;
  onCommit: (label: string) => void;
}

/** One option's label: local text, committed on blur or Enter; Escape puts the saved label back. */
function OptionLabel({ value, index, validate, onCommit }: OptionLabelProps) {
  const id = useId();
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  const [error, setError] = useState<string | null>(null);

  // A new value from outside (reorder, undo, discard) replaces the local text.
  if (value !== synced) {
    setSynced(value);
    setText(value);
    setError(null);
  }

  function commit() {
    const label = text.trim();
    if (label === value) {
      setText(value);
      setError(null);
      return;
    }
    const problem = validate(label);
    setError(problem);
    if (problem === null) onCommit(label);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      setText(value);
      setError(null);
    }
  }

  return (
    <div className={styles.label}>
      <input
        className={`admin-input ${styles.input} ${error ? fields.invalid : ""}`}
        value={text}
        aria-label={`Option ${index + 1}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete="off"
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
      />
      {error ? (
        <p id={`${id}-error`} className={fields.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface AddOptionProps {
  validate: (label: string) => string | null;
  onAdd: (label: string) => void;
}

function AddOption({ validate, onAdd }: AddOptionProps) {
  const id = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const label = text.trim();
    const problem = validate(label);
    setError(problem);
    if (problem !== null) return;
    onAdd(label);
    setText("");
  }

  return (
    <div className={styles.add}>
      <div className={styles.addRow}>
        <input
          className={`admin-input ${styles.input} ${error ? fields.invalid : ""}`}
          value={text}
          placeholder="New option, e.g. Long"
          aria-label="New option"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
          onChange={(event) => {
            setText(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit(event);
          }}
        />
        <button type="button" className={`admin-button ${shared.secondary}`} onClick={submit}>
          Add option
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className={fields.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
