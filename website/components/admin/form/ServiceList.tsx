"use client";

import { SERVICE_LIST } from "@/lib/admin/form-selection";
import type { FormItem } from "@/lib/admin/form-selection";
import { DirtyDot } from "./DirtyDot";
import styles from "./FormShell.module.css";

interface ServiceListProps {
  selected?: FormItem;
  dirty: ReadonlySet<string>;
  onSelect: (item: FormItem) => void;
}

/** Services grouped by category, each category's intro first. */
export function ServiceList({ selected, dirty, onSelect }: ServiceListProps) {
  return (
    <nav className={styles.list} aria-label="Services">
      {SERVICE_LIST.map((group) => (
        <div key={group.category} className={styles.group}>
          <h3 className={styles.groupTitle}>{group.name}</h3>
          <ul className={styles.entries}>
            {group.entries.map((entry) => (
              <li key={entry.item}>
                <button
                  type="button"
                  className={styles.entry}
                  data-item={entry.item}
                  aria-current={selected === entry.item ? "true" : undefined}
                  onClick={() => onSelect(entry.item)}
                >
                  <span className={styles.entryLabel}>{entry.label}</span>
                  {dirty.has(entry.item) ? <DirtyDot /> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
