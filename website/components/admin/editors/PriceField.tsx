"use client";

import { useId } from "react";
import { normalizePrice } from "@/lib/content/normalize";
import { useNormalizedField } from "./use-normalized-field";
import styles from "./fields.module.css";

interface PriceFieldProps {
  label: string;
  value: string;
  onChange: (price: string) => void;
  /** False refuses a new price: the field goes back to `value`. */
  accept?: (price: string) => boolean;
  /** Keeps the label for screen readers only, e.g. in a grid whose headers already show it. */
  hideLabel?: boolean;
}

const INVALID = "Use a price like £80, £30 – £40 or £100+, or – for none.";

/** A price, normalized to "£80" / "£30 – £40" on blur. Invalid text never reaches the draft. */
export function PriceField({ label, value, onChange, accept, hideLabel }: PriceFieldProps) {
  const id = useId();
  const field = useNormalizedField({
    value,
    normalize: normalizePrice,
    onCommit: onChange,
    accept,
    invalidMessage: INVALID,
  });
  return (
    <div className={styles.field}>
      <label className={hideLabel ? styles.visuallyHidden : "admin-label"} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`admin-input ${field.error ? styles.invalid : ""}`}
        value={field.text}
        inputMode="text"
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
    </div>
  );
}
