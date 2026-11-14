"use client";

import { useEffect, useRef } from "react";
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
  /** The phone back link from an editor to the Services list. */
  onBackToList: () => void;
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
export function FormShell({
  selection,
  dirty,
  onSelect,
  onBackToList,
  title,
  children,
}: FormShellProps) {
  const shell = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const services = selection.section === "services";
  // The selection last shown. Null until mounted, so the first render moves neither focus nor scroll.
  const shown = useRef<FormSelection | null>(null);

  // Every later selection change is the admin's doing (a click, a warning link, back/forward).
  useEffect(() => {
    const prev = shown.current;
    if (prev && formSelectionQuery(prev) === formSelectionQuery(selection)) return;
    shown.current = selection;
    const node = shell.current;
    if (!prev || !node) return;

    // Back to the Services list (link or back gesture): focus the entry that was open, which also
    // scrolls it into view.
    if (prev.section === "services" && prev.item && services && !selection.item) {
      node.querySelector<HTMLElement>(`[data-item="${CSS.escape(prev.item)}"]`)?.focus();
      return;
    }

    // scroll-margin-top clears the draft bar pinned above the shell from 820px.
    const margin = parseFloat(getComputedStyle(node).scrollMarginTop) || 0;
    if (node.getBoundingClientRect().top < margin) node.scrollIntoView({ block: "start" });
    // The control that was used may now be hidden (phones): move focus to the new pane.
    heading.current?.focus({ preventScroll: true });
  }, [selection, services]);

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
            onClick={() => onSelect({ section: id })}
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
          onSelect={(item) => onSelect({ section: "services", item })}
        />
      ) : null}

      <div className={styles.pane}>
        {services && selection.item ? (
          <button type="button" className={styles.back} onClick={onBackToList}>
            <span aria-hidden="true">‹</span> Services
          </button>
        ) : null}
        {children === null ? (
          <p className={styles.empty}>Choose a service or a category intro from the list.</p>
        ) : (
          <section className={styles.panel} aria-label={title}>
            <h2 ref={heading} className={styles.title} tabIndex={-1}>
              {title}
            </h2>
            {children}
          </section>
        )}
      </div>
    </div>
  );
}
