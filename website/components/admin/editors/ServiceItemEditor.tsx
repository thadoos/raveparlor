"use client";

import { clearItemNote, setItemContent } from "@/lib/admin/draft-ops";
import type { ItemCopyPatch } from "@/lib/admin/draft-ops";
import type { EditTarget } from "@/lib/admin/targets";
import type { CategoryKey } from "@/lib/content/schema";
import { MENU_STRUCTURE } from "@/lib/content/structure";
import { ChemicalNoteEditor } from "./ChemicalNoteEditor";
import { ItemPhotosEditor } from "./ItemPhotosEditor";
import { OptionsEditor } from "./OptionsEditor";
import { BarberOptionToggle, PriceGrid } from "./PriceGrid";
import { TextArea } from "./TextArea";
import { TextField } from "./TextField";
import type { EditorProps } from "./types";
import shared from "./Editor.module.css";
import styles from "./ServiceItemEditor.module.css";

interface ServiceItemEditorProps extends EditorProps {
  category: CategoryKey;
  item: string;
  /** Opens another editor. Without it, links fall back to the form-mode section anchor. */
  onOpenTarget?: (target: EditTarget) => void;
}

/** One service: options, barber option and price grid, then its copy, note and photos. */
export function ServiceItemEditor({
  draft,
  apply,
  category,
  item,
  onOpenTarget,
}: ServiceItemEditorProps) {
  const structure = MENU_STRUCTURE[category].items.find((i) => i.key === item);
  const items = draft.services[category].items;
  const data = Object.hasOwn(items, item) ? items[item] : undefined;
  if (!structure || !data) return <p className={shared.note}>This service no longer exists.</p>;

  const editor = { draft, apply, category, item };
  const patch = (p: ItemCopyPatch) => apply((c) => setItemContent(c, category, item, p));

  return (
    <div className={shared.stack}>
      <TextField label="Service" value={structure.name} onChange={() => {}} readOnly />

      <OptionsEditor {...editor} />

      <div className={styles.prices}>
        <BarberOptionToggle {...editor} />
        <PriceGrid {...editor} />
        {data.byBarber ? (
          <p className={shared.note}>
            To add or remove a barber, go to{" "}
            {onOpenTarget ? (
              <button
                type="button"
                className={shared.textButton}
                onClick={() => onOpenTarget({ kind: "barbers" })}
              >
                Barbers
              </button>
            ) : (
              <a className={shared.textButton} href="#edit-barbers">
                Barbers
              </a>
            )}
            .
          </p>
        ) : null}
      </div>

      <TextArea label="Description" value={data.desc} onChange={(desc) => patch({ desc })} />
      <TextField label="Ideal for" value={data.ideal} onChange={(ideal) => patch({ ideal })} />

      {structure.chemicalNote ? <ChemicalNoteEditor draft={draft} apply={apply} /> : null}
      <TextArea
        label={structure.chemicalNote ? "Own note" : "Note"}
        value={data.note ?? ""}
        onChange={(note) =>
          apply((c) =>
            note === ""
              ? clearItemNote(c, category, item)
              : setItemContent(c, category, item, { note }),
          )
        }
        hint={
          structure.chemicalNote
            ? "Optional. Replaces the shared note for this service only."
            : "Optional. Leave empty for no note."
        }
        rows={2}
      />

      <div className={styles.photos}>
        <p className="admin-label">Photos</p>
        <ItemPhotosEditor {...editor} />
      </div>
    </div>
  );
}
