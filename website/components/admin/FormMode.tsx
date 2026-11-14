"use client";

import { useCallback, useMemo } from "react";
import { EditorFor } from "@/components/admin/editors/EditorFor";
import type { EditorProps } from "@/components/admin/editors/types";
import { FormShell } from "@/components/admin/form/FormShell";
import styles from "@/components/admin/form/FormShell.module.css";
import {
  FORM_SECTIONS,
  dirtySections,
  selectionTarget,
  targetSelection,
} from "@/lib/admin/form-selection";
import type { FormSelection } from "@/lib/admin/form-selection";
import { IMAGE_GROUPS, imageSlotLabel, targetKey, targetLabel } from "@/lib/admin/targets";
import type { EditTarget } from "@/lib/admin/targets";
import type { SiteContent } from "@/lib/content/schema";

interface FormModeProps extends EditorProps {
  /** The draft as last saved, for the changed-section dots. */
  saved: SiteContent;
  selection: FormSelection;
  onSelect: (next: FormSelection) => void;
  onBackToList: () => void;
}

/** Form editing: one section (or one service) at a time inside the sidebar shell. */
export function FormMode({
  draft,
  saved,
  apply,
  selection,
  onSelect,
  onBackToList,
}: FormModeProps) {
  const dirty = useMemo(() => dirtySections(saved, draft), [saved, draft]);
  const openTarget = useCallback(
    (target: EditTarget) => onSelect(targetSelection(target)),
    [onSelect],
  );

  const target = selectionTarget(selection);
  const sectionLabel = FORM_SECTIONS.find((s) => s.id === selection.section)?.label ?? "";

  let body = null;
  if (selection.section === "photos") {
    body = (
      <div className={styles.photoGroups}>
        {IMAGE_GROUPS.map((group) => (
          <section key={group.title} className={styles.photoGroup} aria-label={group.title}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            <div className={styles.photoGrid}>
              {group.slots.map((slot) => (
                <section key={slot} className={styles.photoCard} aria-label={imageSlotLabel(slot)}>
                  <h4 className={styles.photoTitle}>{imageSlotLabel(slot)}</h4>
                  <EditorFor target={{ kind: "image", slot }} draft={draft} apply={apply} />
                </section>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  } else if (target) {
    body = (
      <EditorFor
        key={targetKey(target)}
        target={target}
        draft={draft}
        apply={apply}
        onOpenTarget={openTarget}
      />
    );
  }

  return (
    <FormShell
      selection={selection}
      dirty={dirty}
      onSelect={onSelect}
      onBackToList={onBackToList}
      title={target ? targetLabel(target, draft) : sectionLabel}
    >
      {body}
    </FormShell>
  );
}
