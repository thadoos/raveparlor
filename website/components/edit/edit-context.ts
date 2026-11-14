"use client";

import { createContext, useContext } from "react";
import { targetKey } from "@/lib/admin/target-key";
import type { EditTarget } from "@/lib/admin/target-key";

export interface EditContextValue {
  onEdit(target: EditTarget): void;
}

/** Present only inside the admin preview (PreviewClient); the public site has none. */
export const EditContext = createContext<EditContextValue | null>(null);

export function useEditContext(): EditContextValue | null {
  return useContext(EditContext);
}

/**
 * The attribute that marks an element as editable, for elements a wrapper would break (a grid item
 * styled with `:last-child`, say). Empty outside the preview, so the public DOM is unchanged.
 */
export function useEditTargetProps(target: EditTarget): { "data-edit-target"?: string } {
  return useEditContext() ? { "data-edit-target": targetKey(target) } : {};
}
