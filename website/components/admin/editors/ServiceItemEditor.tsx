"use client";

import { clearItemNote, setItemContent } from "@/lib/admin/draft-ops";
import type { EditTarget } from "@/lib/admin/targets";
import type { CategoryKey } from "@/lib/content/schema";
import { MENU_STRUCTURE } from "@/lib/content/structure";
import { ChemicalNoteEditor } from "./ChemicalNoteEditor";
import { PriceField } from "./PriceField";
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

/** One service: its prices (laid out by the item's kind), description, "ideal for" and note. */
export function ServiceItemEditor({
  draft,
  apply,
  category,
  item,
  onOpenTarget,
}: ServiceItemEditorProps) {
  const structure = MENU_STRUCTURE[category].items.find((i) => i.key === item);
  const data = draft.services[category].items[item];
  if (!structure || !data) return <p className={shared.note}>This service no longer exists.</p>;

  const patch = (p: Parameters<typeof setItemContent>[3]) =>
    apply((c) => setItemContent(c, category, item, p));

  return (
    <div className={shared.stack}>
      <TextField label="Service" value={structure.name} onChange={() => {}} readOnly />

      {structure.kind === "barberTable" ? (
        <div className={styles.perBarber}>
          <p className={shared.note}>Prices are set per barber.</p>
          {onOpenTarget ? (
            <button
              type="button"
              className={shared.textButton}
              onClick={() => onOpenTarget({ kind: "barbers" })}
            >
              Edit barbers
            </button>
          ) : (
            <a className={shared.textButton} href="#edit-barbers">
              Edit barbers
            </a>
          )}
        </div>
      ) : structure.kind === "table" ? (
        <div className={shared.row}>
          {(structure.cols ?? []).map((col, index) => (
            <PriceField
              key={col}
              label={col}
              value={data.prices?.[index] ?? ""}
              onChange={(price) =>
                apply((c) => {
                  const prices = [...(c.services[category].items[item].prices ?? [])];
                  prices[index] = price;
                  return setItemContent(c, category, item, { prices });
                })
              }
            />
          ))}
        </div>
      ) : (
        <PriceField label="Price" value={data.range ?? ""} onChange={(range) => patch({ range })} />
      )}

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
    </div>
  );
}
