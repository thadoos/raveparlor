"use client";

import { useId } from "react";
import styles from "./fields.module.css";

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
}

/** Multi-line text that writes to the draft as you type. */
export function TextArea({ label, value, onChange, hint, rows = 3 }: TextAreaProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label className="admin-label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className={`admin-input ${styles.textarea}`}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
