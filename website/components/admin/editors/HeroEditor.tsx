"use client";

import { setHeroCaption } from "@/lib/admin/draft-ops";
import type { HeroCaption } from "@/lib/content/schema";
import { TextField } from "./TextField";
import type { EditorProps } from "./types";
import styles from "./Editor.module.css";

interface CaptionFieldsProps extends EditorProps {
  side: "left" | "right";
  heading: string;
}

function CaptionFields({ draft, apply, side, heading }: CaptionFieldsProps) {
  const caption = draft.hero[side];
  const patch = (p: Partial<HeroCaption>) => apply((c) => setHeroCaption(c, side, p));
  return (
    <section className={styles.stack} aria-label={heading}>
      <p className="admin-label">{heading}</p>
      <TextField
        label="Title"
        value={caption.title}
        onChange={(title) => patch({ title })}
        required
      />
    </section>
  );
}

/** The title shown over each hero photo. */
export function HeroEditor({ draft, apply }: EditorProps) {
  return (
    <div className={styles.stack}>
      <CaptionFields draft={draft} apply={apply} side="left" heading="Left half" />
      <CaptionFields draft={draft} apply={apply} side="right" heading="Right half" />
    </div>
  );
}
