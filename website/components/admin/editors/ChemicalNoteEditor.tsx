"use client";

import { setChemicalNote } from "@/lib/admin/draft-ops";
import { MENU_STRUCTURE } from "@/lib/content/structure";
import { TextArea } from "./TextArea";
import type { EditorProps } from "./types";

/** How many services show the shared chemical note. */
export const CHEMICAL_NOTE_COUNT = Object.values(MENU_STRUCTURE).reduce(
  (count, category) => count + category.items.filter((item) => item.chemicalNote).length,
  0,
);

/** The note shared by every chemical service (colour, perm) that has no note of its own. */
export function ChemicalNoteEditor({ draft, apply }: EditorProps) {
  return (
    <TextArea
      label="Chemical services note"
      value={draft.sharedNotes.chemical}
      onChange={(text) => apply((c) => setChemicalNote(c, text))}
      hint={`Shared by ${CHEMICAL_NOTE_COUNT} services`}
    />
  );
}
