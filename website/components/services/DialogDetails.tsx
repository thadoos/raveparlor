"use client";

import { useEditTargetProps } from "@/components/edit/edit-context";
import type { CategoryKey, MenuItem } from "@/lib/data/services";
import styles from "./DialogDetails.module.css";

interface DialogDetailsProps {
  category: CategoryKey;
  item: MenuItem;
  /** True while the booking step is shown: the details collapse and become inert. */
  flipped: boolean;
}

/**
 * Description, "Ideal for" and "Good to know" (one edit target in the admin preview). Collapses when
 * the booking step starts.
 */
export function DialogDetails({ category, item, flipped }: DialogDetailsProps) {
  const editProps = useEditTargetProps({ kind: "item", category, item: item.key });
  return (
    <div className={styles.flip} id="md-flip" data-flipped={flipped ? "" : undefined}>
      <div className={styles.front} id="md-front" inert={flipped} aria-hidden={flipped}>
        <div className={styles.collapse} {...editProps}>
          <p className={styles.desc} id="md-desc">
            {item.desc}
          </p>
          {item.ideal && (
            <div className={styles.block} id="md-ideal-wrap">
              <h4>Ideal for</h4>
              <p id="md-ideal">{item.ideal}</p>
            </div>
          )}
          {item.note && (
            <div className={styles.block} id="md-note-wrap">
              <h4>Good to know</h4>
              <p id="md-note">{item.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
