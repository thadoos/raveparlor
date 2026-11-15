"use client";

import { useId } from "react";
import styles from "./fields.module.css";

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
  /** Shows "Required" while the value is blank. */
  required?: boolean;
  maxLength?: number;
}

/** Multi-line text that writes to the draft as you type. */
export function TextArea({
  label,
  value,
  onChange,
  hint,
  rows = 3,
  required,
  maxLength,
}: TextAreaProps) {
  const id = useId();
  const missing = required && value.trim() === "";
  return (
    <div className={styles.field}>
      <label className="admin-label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className={`admin-input ${styles.textarea} ${missing ? styles.invalid : ""}`}
        value={value}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={missing || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {missing ? <p className={styles.error}>Required</p> : null}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
