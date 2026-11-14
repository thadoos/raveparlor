"use client";

import { useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { addBarber, moveBarber, removeBarber } from "@/lib/admin/draft-ops";
import { newId } from "@/lib/admin/uuid";
import { normalizePrice, normalizeWhatsApp } from "@/lib/content/normalize";
import type { Barber } from "@/lib/content/schema";
import { CUT_COLUMNS } from "@/lib/content/structure";
import { BarberEditor } from "./BarberEditor";
import type { EditorProps } from "./types";
import shared from "./Editor.module.css";
import fields from "./fields.module.css";
import styles from "./BarbersEditor.module.css";

interface Drag {
  id: string;
  pointerId: number;
  /** Vertical midpoints of the other rows, captured when the drag starts. */
  midpoints: number[];
  to: number;
}

/** The barbers list: reorder (drag handle or up/down), edit, add and remove. */
export function BarbersEditor({ draft, apply }: EditorProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Barber | null>(null);
  const [adding, setAdding] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());

  const barbers = draft.barbers;
  const order = drag ? previewOrder(barbers, drag) : barbers;

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, id: string) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const midpoints = barbers
      .filter((b) => b.id !== id)
      .map((b) => {
        const rect = rows.current.get(b.id)?.getBoundingClientRect();
        return rect ? rect.top + rect.height / 2 : 0;
      });
    setOpen(null);
    setDrag({
      id,
      pointerId: event.pointerId,
      midpoints,
      to: barbers.findIndex((b) => b.id === id),
    });
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const to = drag.midpoints.filter((mid) => mid < event.clientY).length;
    if (to !== drag.to) setDrag({ ...drag, to });
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>, commit: boolean) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (commit) apply((c) => moveBarber(c, drag.id, drag.to));
    setDrag(null);
  }

  return (
    <div className={shared.stack}>
      <ol className={styles.list}>
        {order.map((barber) => {
          const index = barbers.findIndex((b) => b.id === barber.id);
          const isOpen = open === barber.id;
          return (
            <li
              key={barber.id}
              ref={(node) => {
                if (node) rows.current.set(barber.id, node);
                else rows.current.delete(barber.id);
              }}
              className={`${styles.item} ${drag?.id === barber.id ? styles.dragging : ""}`}
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
                    onClick={() => setRemoving(barber)}
                  >
                    Remove barber
                  </button>
                  {barbers.length === 1 ? (
                    <p className={shared.note}>The site needs at least one barber.</p>
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

function previewOrder(barbers: Barber[], drag: Drag): Barber[] {
  const moving = barbers.find((b) => b.id === drag.id);
  if (!moving) return barbers;
  const rest = barbers.filter((b) => b.id !== drag.id);
  rest.splice(drag.to, 0, moving);
  return rest;
}

interface AddBarberFormProps {
  existingNames: string[];
  onAdd: (barber: Omit<Barber, "id">) => void;
  onCancel: () => void;
}

type AddField = "name" | "days" | "whatsApp" | "price0" | "price1" | "price2";
type AddErrors = Partial<Record<AddField, string>>;

/** Inline form for a new barber. Nothing reaches the draft until every field is valid. */
function AddBarberForm({ existingNames, onAdd, onCancel }: AddBarberFormProps) {
  const [values, setValues] = useState<Record<AddField, string>>({
    name: "",
    days: "",
    whatsApp: "",
    price0: "",
    price1: "",
    price2: "",
  });
  const [errors, setErrors] = useState<AddErrors>({});

  const set = (field: AddField) => (value: string) => setValues((v) => ({ ...v, [field]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: AddErrors = {};
    const name = values.name.trim();
    const days = values.days.trim();
    const whatsApp = normalizeWhatsApp(values.whatsApp);
    const prices = [values.price0, values.price1, values.price2].map(normalizePrice);

    if (!name) next.name = "Required";
    else if (existingNames.some((n) => n.trim().toLowerCase() === name.toLowerCase())) {
      next.name = "Another barber already has this name.";
    }
    if (!days) next.days = "Required";
    if (!whatsApp) next.whatsApp = "Enter a phone number like 07789 096148.";
    prices.forEach((price, i) => {
      if (!price) next[`price${i}` as AddField] = "Use a price like £80 or £30 – £40.";
    });

    setErrors(next);
    const [p0, p1, p2] = prices;
    if (Object.keys(next).length > 0 || !whatsApp || !p0 || !p1 || !p2) return;
    onAdd({ name, days, whatsApp, cutPrices: [p0, p1, p2] });
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
      <div className={shared.row}>
        {CUT_COLUMNS.map((col, i) => {
          const field = `price${i}` as AddField;
          return (
            <AddInput
              key={col}
              label={col}
              value={values[field]}
              onChange={set(field)}
              error={errors[field]}
              placeholder="£40"
            />
          );
        })}
      </div>
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
