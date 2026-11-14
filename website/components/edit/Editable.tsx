"use client";

import type { ReactNode } from "react";
import { targetKey } from "@/lib/admin/targets";
import type { EditTarget } from "@/lib/admin/targets";
import styles from "./Editable.module.css";
import { useEditContext } from "./edit-context";

interface EditableProps {
  target: EditTarget;
  children: ReactNode;
}

/**
 * Marks a region of the site as editable in the admin preview. Outside the preview it renders its
 * children alone, so the public site's DOM is unchanged.
 */
export function Editable({ target, children }: EditableProps) {
  const context = useEditContext();
  if (!context) return children;
  return (
    <span className={styles.editable} data-edit-target={targetKey(target)}>
      {children}
    </span>
  );
}
