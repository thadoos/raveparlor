"use client";

import { useId } from "react";
import { formatUkPhone, normalizeWhatsApp } from "@/lib/content/normalize";
import { useNormalizedField } from "./use-normalized-field";
import styles from "./fields.module.css";

interface PhoneFieldProps {
  label: string;
  /** Normalized digits, e.g. "447789096148". */
  value: string;
  onChange: (digits: string) => void;
  hint?: string;
}

const INVALID = "Enter a phone number like 07789 096148 or +44 7789 096148.";

/** A WhatsApp number shown as "07789 096148", stored as digits. Normalized on blur. */
export function PhoneField({ label, value, onChange, hint }: PhoneFieldProps) {
  const id = useId();
  const field = useNormalizedField({
    value,
    normalize: normalizeWhatsApp,
    format: formatUkPhone,
    onCommit: onChange,
    invalidMessage: INVALID,
  });
  return (
    <div className={styles.field}>
      <label className="admin-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`admin-input ${field.error ? styles.invalid : ""}`}
        value={field.text}
        type="tel"
        inputMode="tel"
        autoComplete="off"
        aria-invalid={field.error ? true : undefined}
        aria-describedby={field.error ? `${id}-error` : undefined}
        onChange={(event) => field.setText(event.target.value)}
        onBlur={field.onBlur}
      />
      {field.error ? (
        <p id={`${id}-error`} className={styles.error}>
          {field.error}
        </p>
      ) : null}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
