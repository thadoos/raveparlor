import styles from "./FormShell.module.css";

/** Marks a section or service that differs from the saved draft. */
export function DirtyDot() {
  return (
    <span className={styles.dot}>
      <span className={styles.visuallyHidden}>(unsaved changes)</span>
    </span>
  );
}
