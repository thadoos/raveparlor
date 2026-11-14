"use client";

import { setImage, setImageAlt } from "@/lib/admin/draft-ops";
import type { ImageSlot } from "@/lib/content/schema";
import { PhotoEditor } from "./PhotoEditor";
import type { EditorProps } from "./types";

interface ImageSlotEditorProps extends EditorProps {
  slot: ImageSlot;
}

/** One site image slot: preview, replace and alt text. Uploads go to the slot's own folder. */
export function ImageSlotEditor({ draft, apply, slot }: ImageSlotEditorProps) {
  return (
    <PhotoEditor
      photo={draft.images[slot]}
      folder={slot}
      onReplace={(image) => apply((c) => setImage(c, slot, { ...image, alt: c.images[slot].alt }))}
      onAltChange={(alt) => apply((c) => setImageAlt(c, slot, alt))}
    />
  );
}
