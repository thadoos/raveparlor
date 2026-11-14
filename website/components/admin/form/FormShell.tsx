"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { FORM_SECTIONS, formSelectionQuery } from "@/lib/admin/form-selection";
import type { FormItem, FormSection, FormSelection } from "@/lib/admin/form-selection";
import { cx } from "@/lib/cx";
import { DirtyDot } from "./DirtyDot";
import { ServiceList } from "./ServiceList";
import styles from "./FormShell.module.css";

interface FormShellProps {
  selection: FormSelection;
  dirty: ReadonlySet<FormSection | FormItem>;
  onSelect: (next: FormSelection) => void;
  /** The editor pane's heading. */
  title: string;
  /** The editor pane's body; null in Services while nothing is selected. */
  children: ReactNode;
}

/**
 * Form mode's frame. From 820px: a section sidebar, the Services list when Services is open, and the
 * editor pane. Phones: a section tab strip, then either the Services list or one editor with a back
 * link to the list.
 */
export function FormShell({ selection, dirty, onSelect, title, children }: FormShellProps) {
  const shell = useRef<HTMLDivElement>(null);
  // The entry the phone back link returns to, focused (and so scrolled into view) in the list.
  const [returnTo, setReturnTo] = useState<FormItem | undefined>();
  const services = selection.section === "services";
  const query = formSelectionQuery(selection);
  const firstRender = useRef(true);

  // A new selection starts at the top of the shell, unless the back link is restoring the list.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (returnTo) return;
    const node = shell.current;
    if (!node) return;
    // scroll-margin-top clears the draft bar pinned above the shell from 820px.
    const margin = parseFloat(getComputedStyle(node).scrollMarginTop) || 0;
    if (node.getBoundingClientRect().top < margin) node.scrollIntoView({ block: "start" });
  }, [query, returnTo]);

  const select = (next: FormSelection) => {
    setReturnTo(undefined);
    onSelect(next);
  };

  return (
    <div
      ref={shell}
      className={cx(
        styles.shell,
        services && styles.withList,
        services && selection.item && styles.withItem,
      )}
    >
      <nav className={styles.sections} aria-label="Sections">
        {FORM_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={styles.section}
            aria-current={selection.section === id ? "page" : undefined}
            onClick={() => select({ section: id })}
          >
            <span>{label}</span>
            {dirty.has(id) ? <DirtyDot /> : null}
          </button>
        ))}
      </nav>

      {services ? (
        <ServiceList
          selected={selection.item}
          dirty={dirty}
          focusItem={returnTo}
          onSelect={(item) => select({ section: "services", item })}
        />
      ) : null}

      <div className={styles.pane}>
        {services && selection.item ? (
          <button
            type="button"
            className={styles.back}
            onClick={() => {
              setReturnTo(selection.item);
              onSelect({ section: "services" });
            }}
          >
            <span aria-hidden="true">‹</span> Services
          </button>
        ) : null}
        {children === null ? (
          <p className={styles.empty}>Choose a service or a category intro from the list.</p>
        ) : (
          <section className={styles.panel} aria-label={title}>
            <h2 className={styles.title}>{title}</h2>
            {children}
          </section>
        )}
      </div>
    </div>
  );
}
