"use client";

import { updateBarber } from "@/lib/admin/draft-ops";
import { PhoneField } from "./PhoneField";
import { TextField } from "./TextField";
import type { EditorProps } from "./types";
import styles from "./Editor.module.css";

interface BarberEditorProps extends EditorProps {
  id: string;
}

/** One barber's name, working days and WhatsApp number. Their prices live on each service. */
export function BarberEditor({ draft, apply, id }: BarberEditorProps) {
  const barber = draft.barbers.find((b) => b.id === id);
  if (!barber) return <p className={styles.note}>This barber has been removed.</p>;

  const patch = (p: Parameters<typeof updateBarber>[2]) => apply((c) => updateBarber(c, id, p));
  const duplicate = draft.barbers.some(
    (b) => b.id !== id && b.name.trim().toLowerCase() === barber.name.trim().toLowerCase(),
  );

  return (
    <div className={styles.stack}>
      <TextField
        label="Name"
        value={barber.name}
        onChange={(name) => patch({ name })}
        required
        hint={duplicate ? "Another barber already has this name." : undefined}
      />
      <TextField
        label="Working days"
        value={barber.days}
        onChange={(days) => patch({ days })}
        required
        hint="For example: Mon, Wed – Fri"
      />
      <PhoneField
        label="WhatsApp number"
        value={barber.whatsApp}
        onChange={(whatsApp) => patch({ whatsApp })}
        hint="Booking messages for this barber go here."
      />
    </div>
  );
}
