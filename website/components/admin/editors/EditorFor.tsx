"use client";

import type { EditTarget } from "@/lib/admin/targets";
import { BarberEditor } from "./BarberEditor";
import { BarbersEditor } from "./BarbersEditor";
import { BusinessEditor } from "./BusinessEditor";
import { CategoryIntroEditor } from "./CategoryIntroEditor";
import { ChemicalNoteEditor } from "./ChemicalNoteEditor";
import { HoursEditor } from "./HoursEditor";
import { ImageSlotEditor } from "./ImageSlotEditor";
import { ItemPhotosEditor } from "./ItemPhotosEditor";
import { ServiceItemEditor } from "./ServiceItemEditor";
import type { EditorProps } from "./types";

interface EditorForProps extends EditorProps {
  target: EditTarget;
  /** Lets an editor open another one (e.g. a service's link to Barbers). */
  onOpenTarget?: (target: EditTarget) => void;
}

/** The editor for a target. Form mode and visual mode both render editors through this. */
export function EditorFor({ target, draft, apply, onOpenTarget }: EditorForProps) {
  switch (target.kind) {
    case "barbers":
      return <BarbersEditor draft={draft} apply={apply} />;
    case "barber":
      return <BarberEditor draft={draft} apply={apply} id={target.id} />;
    case "item":
      return (
        <ServiceItemEditor
          draft={draft}
          apply={apply}
          category={target.category}
          item={target.item}
          focus={target.focus}
          onOpenTarget={onOpenTarget}
        />
      );
    case "itemPhoto":
      return (
        <ItemPhotosEditor
          draft={draft}
          apply={apply}
          category={target.category}
          item={target.item}
          index={target.index}
        />
      );
    case "intro":
      return <CategoryIntroEditor draft={draft} apply={apply} category={target.category} />;
    case "hours":
      return <HoursEditor draft={draft} apply={apply} />;
    case "business":
      return <BusinessEditor draft={draft} apply={apply} />;
    case "chemicalNote":
      return <ChemicalNoteEditor draft={draft} apply={apply} />;
    case "image":
      return <ImageSlotEditor draft={draft} apply={apply} slot={target.slot} />;
  }
}
