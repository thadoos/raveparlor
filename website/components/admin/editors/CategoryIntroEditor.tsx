"use client";

import { setIntro } from "@/lib/admin/draft-ops";
import type { CategoryKey } from "@/lib/content/schema";
import { TextArea } from "./TextArea";
import type { EditorProps } from "./types";
import styles from "./Editor.module.css";

interface CategoryIntroEditorProps extends EditorProps {
  category: CategoryKey;
}

/** The two intro paragraphs at the top of a service category. */
export function CategoryIntroEditor({ draft, apply, category }: CategoryIntroEditorProps) {
  const [first, second] = draft.services[category].intro;
  return (
    <div className={styles.stack}>
      <TextArea
        label="First paragraph"
        value={first}
        onChange={(text) => apply((c) => setIntro(c, category, 0, text))}
      />
      <TextArea
        label="Second paragraph"
        value={second}
        onChange={(text) => apply((c) => setIntro(c, category, 1, text))}
      />
    </div>
  );
}
