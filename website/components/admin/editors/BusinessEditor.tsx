"use client";

import { setDefaultWhatsApp } from "@/lib/admin/draft-ops";
import { PhoneField } from "./PhoneField";
import type { EditorProps } from "./types";
import styles from "./Editor.module.css";

/** Business-wide contact details. */
export function BusinessEditor({ draft, apply }: EditorProps) {
  return (
    <div className={styles.stack}>
      <PhoneField
        label="Main WhatsApp number"
        value={draft.business.defaultWhatsApp}
        onChange={(digits) => apply((c) => setDefaultWhatsApp(c, digits))}
        hint="Shown as the salon's phone number and used for general booking messages."
      />
    </div>
  );
}
