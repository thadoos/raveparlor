"use client";

import { useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { dragOffsets, dragTargetIndex } from "@/lib/admin/drag-reorder";
import {
  addBarber,
  moveBarber,
  NEEDS_PRICE,
  removeBarber,
  removeBarberDropsLastPrice,
} from "@/lib/admin/draft-ops";
import { newId } from "@/lib/admin/uuid";
import { normalizeWhatsApp } from "@/lib/content/normalize";
import type { Barber } from "@/lib/content/schema";
import { BarberEditor } from "./BarberEditor";
import type { EditorProps } from "./types";
import shared from "./Editor.module.css";
import fields from "./fields.module.css";
import styles from "./BarbersEditor.module.css";

interface Drag {
  id: string;
  pointerId: number;
  startIndex: number;
  startY: number;
  /** Row heights in list order, measured when the drag starts. */
  heights: number[];
  deltaY: number;
}

/** The barbers list: reorder (drag handle or up/down), edit, add and remove. */
export function BarbersEditor({ draft, apply }: EditorProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Barber | null>(null);
  /** The barber whose removal was refused: the only one with prices for some service. */
  const [blocked, setBlocked] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // The DOM order never changes mid-drag (moving the capturing node would drop pointer capture):
  // the preview is drawn with translateY and the move is applied on release. Handlers read the
  // ref, so a pointerup followed by lostpointercapture can't act on a stale drag.
  const [drag, setDragState] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());

  const barbers = draft.barbers;
  const toIndex = drag ? dragTargetIndex(drag.startIndex, drag.deltaY, drag.heights) : -1;
  const offsets = drag ? dragOffsets(drag.startIndex, toIndex, drag.deltaY, drag.heights) : null;

  function setDrag(next: Drag | null) {
    dragRef.current = next;
    setDragState(next);
  }

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, id: string) {
    if (event.button !== 0 || dragRef.current) return;
    const startIndex = barbers.findIndex((b) => b.id === id);
    if (startIndex === -1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const heights = barbers.map((b) => rows.current.get(b.id)?.getBoundingClientRect().height ?? 0);
    setDrag({
      id,
      pointerId: event.pointerId,
      startIndex,
      startY: event.clientY,
      heights,
      deltaY: 0,
    });
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = dragRef.current;
    if (!current || event.pointerId !== current.pointerId) return;
    setDrag({ ...current, deltaY: event.clientY - current.startY });
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>, commit: boolean) {
    const current = dragRef.current;
    if (!current || event.pointerId !== current.pointerId) return;
    setDrag(null);
    if (!commit) return;
    const to = dragTargetIndex(current.startIndex, current.deltaY, current.heights);
    if (to !== current.startIndex) apply((c) => moveBarber(c, current.id, to));
  }

  return (
    <div className={shared.stack}>
      <ol className={styles.list}>
        {barbers.map((barber, index) => {
          const isOpen = open === barber.id;
          return (
            <li
              key={barber.id}
              ref={(node) => {
                if (node) rows.current.set(barber.id, node);
                else rows.current.delete(barber.id);
              }}
              className={`${styles.item} ${drag ? styles.sorting : ""} ${
                drag?.id === barber.id ? styles.dragging : ""
              }`}
              style={offsets ? { transform: `translateY(${offsets[index]}px)` } : undefined}
            >
              <div className={styles.row}>
                <button
                  type="button"
                  className={styles.handle}
                  aria-label={`Drag to reorder ${barber.name}`}
                  onPointerDown={(event) => startDrag(event, barber.id)}
                  onPointerMove={moveDrag}
                  onPointerUp={(event) => endDrag(event, true)}
                  onPointerCancel={(event) => endDrag(event, false)}
                  onLostPointerCapture={(event) => endDrag(event, false)}
                >
                  <span aria-hidden="true">⠿</span>
                </button>
                <button
                  type="button"
                  className={styles.summary}
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : barber.id)}
                >
                  <span className={styles.name}>{barber.name || "Unnamed barber"}</span>
                  <span className={styles.days}>{barber.days}</span>
                </button>
                <div className={styles.moves}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`Move ${barber.name} up`}
                    disabled={index === 0}
                    onClick={() => apply((c) => moveBarber(c, barber.id, index - 1))}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`Move ${barber.name} down`}
                    disabled={index === barbers.length - 1}
                    onClick={() => apply((c) => moveBarber(c, barber.id, index + 1))}
                  >
                    ↓
                  </button>
                </div>
              </div>
              {isOpen ? (
                <div className={styles.details}>
                  <BarberEditor draft={draft} apply={apply} id={barber.id} />
                  <button
                    type="button"
                    className={`admin-button ${shared.secondary}`}
                    disabled={barbers.length === 1}
                    onClick={() => {
                      if (removeBarberDropsLastPrice(draft, barber.id)) setBlocked(barber.id);
                      else {
                        setBlocked(null);
                        setRemoving(barber);
                      }
                    }}
                  >
                    Remove barber
                  </button>
                  {barbers.length === 1 ? (
                    <p className={shared.note}>The site needs at least one barber.</p>
                  ) : null}
                  {blocked === barber.id ? (
                    <p className={fields.error} role="alert">
                      {NEEDS_PRICE} {barber.name || "This barber"} is the only barber with prices
                      for a service: give another barber prices for it in Services first.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {adding ? (
        <AddBarberForm
          existingNames={barbers.map((b) => b.name)}
          onAdd={(barber) => {
            const id = newId();
            apply((c) => addBarber(c, barber, id));
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button type="button" className="admin-button" onClick={() => setAdding(true)}>
          Add barber
        </button>
      )}

      <ConfirmDialog
        open={removing !== null}
        title={`Remove ${removing?.name ?? "this barber"}?`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (removing) apply((c) => removeBarber(c, removing.id));
          setRemoving(null);
          setOpen(null);
        }}
        onCancel={() => setRemoving(null)}
      >
        They disappear from the price list and booking options once you publish.
      </ConfirmDialog>
    </div>
  );
}

interface AddBarberFormProps {
  existingNames: string[];
  onAdd: (barber: Omit<Barber, "id">) => void;
  onCancel: () => void;
}

type AddField = "name" | "days" | "whatsApp";
type AddErrors = Partial<Record<AddField, string>>;

/** Inline form for a new barber. Nothing reaches the draft until every field is valid. */
function AddBarberForm({ existingNames, onAdd, onCancel }: AddBarberFormProps) {
  const [values, setValues] = useState<Record<AddField, string>>({
    name: "",
    days: "",
    whatsApp: "",
  });
  const [errors, setErrors] = useState<AddErrors>({});

  const set = (field: AddField) => (value: string) => setValues((v) => ({ ...v, [field]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: AddErrors = {};
    const name = values.name.trim();
    const days = values.days.trim();
    const whatsApp = normalizeWhatsApp(values.whatsApp);

    if (!name) next.name = "Required";
    else if (existingNames.some((n) => n.trim().toLowerCase() === name.toLowerCase())) {
      next.name = "Another barber already has this name.";
    }
    if (!days) next.days = "Required";
    if (!whatsApp) next.whatsApp = "Enter a phone number like 07789 096148.";

    setErrors(next);
    if (Object.keys(next).length > 0 || !whatsApp) return;
    onAdd({ name, days, whatsApp });
  }

  return (
    <form className={`${shared.stack} ${styles.addForm}`} onSubmit={submit} noValidate>
      <p className="admin-label">New barber</p>
      <AddInput label="Name" value={values.name} onChange={set("name")} error={errors.name} />
      <AddInput
        label="Working days"
        value={values.days}
        onChange={set("days")}
        error={errors.days}
        placeholder="Mon, Wed – Fri"
      />
      <AddInput
        label="WhatsApp number"
        value={values.whatsApp}
        onChange={set("whatsApp")}
        error={errors.whatsApp}
        type="tel"
      />
      {existingNames.length > 0 ? (
        <p className={shared.note}>
          They start with {existingNames[0]}&apos;s prices on every service priced by barber. Change
          them in Services.
        </p>
      ) : null}
      <div className={styles.formActions}>
        <button type="button" className={`admin-button ${shared.secondary}`} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="admin-button">
          Add
        </button>
      </div>
    </form>
  );
}

interface AddInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: "text" | "tel";
}

function AddInput({ label, value, onChange, error, placeholder, type = "text" }: AddInputProps) {
  return (
    <label className={fields.field}>
      <span className="admin-label">{label}</span>
      <input
        className={`admin-input ${error ? fields.invalid : ""}`}
        value={value}
        type={type}
        placeholder={placeholder}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <span className={fields.error}>{error}</span> : null}
    </label>
  );
}
