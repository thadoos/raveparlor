"use client";

import { useId, useState } from "react";
import styles from "./fields.module.css";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max?: number;
  /** Most decimal places accepted. */
  decimals: 0 | 1;
  hint?: string;
}

const PATTERNS = { 0: /^\d+$/, 1: /^\d+(\.\d)?$/ } as const;

function parse(
  text: string,
  { min, max, decimals }: Pick<NumberFieldProps, "min" | "max" | "decimals">,
) {
  const trimmed = text.trim();
  if (!PATTERNS[decimals].test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < min || (max !== undefined && n > max)) return null;
  return n;
}

function show(value: number, decimals: 0 | 1): string {
  return decimals === 1 ? value.toFixed(1) : String(value);
}

function invalidMessage({
  min,
  max,
  decimals,
}: Pick<NumberFieldProps, "min" | "max" | "decimals">) {
  const kind = decimals === 1 ? "a number with at most one decimal place" : "a whole number";
  const range = max === undefined ? `${min} or more` : `from ${min} to ${max}`;
  return `Enter ${kind}, ${range}.`;
}

/**
 * A number that writes to the draft only while the text is a valid one: in range and within the
 * allowed decimals. Otherwise it shows an error and leaves the draft on its last valid value.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  decimals,
  hint,
}: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(() => show(value, decimals));
  const [synced, setSynced] = useState(value);
  const [error, setError] = useState(false);

  // A new value from outside (undo, discard, another editor) replaces the text. Our own commits
  // already match it, so what was typed (say "4.90") is left alone.
  if (value !== synced) {
    setSynced(value);
    if (parse(text, { min, max, decimals }) !== value) {
      setText(show(value, decimals));
      setError(false);
    }
  }

  function change(next: string) {
    setText(next);
    const n = parse(next, { min, max, decimals });
    setError(n === null);
    if (n !== null && n !== value) onChange(n);
  }

  return (
    <div className={styles.field}>
      <label className="admin-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`admin-input ${error ? styles.invalid : ""}`}
        value={text}
        type="text"
        inputMode={decimals === 1 ? "decimal" : "numeric"}
        autoComplete="off"
        aria-invalid={error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => change(event.target.value)}
        onBlur={() => {
          // Leaving with invalid text puts the last valid value back.
          if (error) {
            setText(show(value, decimals));
            setError(false);
          }
        }}
      />
      {error ? (
        <p id={`${id}-error`} className={styles.error}>
          {invalidMessage({ min, max, decimals })}
        </p>
      ) : null}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
