type ClassValue = string | false | null | undefined;

/** Joins the truthy class names, e.g. `cx(styles.head, dark && styles.isDark)`. */
export function cx(...names: ClassValue[]): string {
  return names.filter(Boolean).join(" ");
}
