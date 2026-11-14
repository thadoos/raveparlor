"use client";

import { useId } from "react";
import styles from "./fields.module.css";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  /** Shows "Required" while the value is blank. */
  required?: boolean;
  readOnly?: boolean;
}

/** One-line text that writes to the draft as you type. */
export function TextField({ label, value, onChange, hint, required, readOnly }: TextFieldProps) {
  const id = useId();
  const missing = required && value.trim() === "";
  return (
    <div className={styles.field}>
      <label className="admin-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`admin-input ${missing ? styles.invalid : ""}`}
        value={value}
        readOnly={readOnly}
        aria-invalid={missing || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {missing ? <p className={styles.error}>Required</p> : null}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
