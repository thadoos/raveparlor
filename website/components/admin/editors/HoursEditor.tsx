"use client";

import { useId, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { setHours } from "@/lib/admin/draft-ops";
import type { DayOfWeek, OpeningHours, SiteContent } from "@/lib/content/schema";
import { TextField } from "./TextField";
import type { EditorProps } from "./types";
import shared from "./Editor.module.css";
import fields from "./fields.module.css";
import styles from "./HoursEditor.module.css";

const WEEK: readonly DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const NEW_ENTRY: OpeningHours = {
  dayOfWeek: ["Sunday"],
  days: "Sunday",
  shortDays: "Sun",
  open: "10:00",
  close: "18:00",
  lastAppointment: "17:00",
};

function updateEntry(c: SiteContent, index: number, patch: Partial<OpeningHours>): SiteContent {
  return setHours(
    c,
    c.business.hours.map((h, i) => (i === index ? { ...h, ...patch } : h)),
  );
}

/** The same checks the content schema makes, shown next to the entry. */
function entryErrors(h: OpeningHours): string[] {
  const errors: string[] = [];
  if (h.dayOfWeek.length === 0) errors.push("Tick at least one day.");
  if (h.open >= h.close) errors.push("Opening time must be before closing time.");
  if (h.lastAppointment < h.open || h.lastAppointment > h.close) {
    errors.push("Last appointment must be between opening and closing time.");
  }
  return errors;
}

/** Opening hours: one entry per group of days with the same times. */
export function HoursEditor({ draft, apply }: EditorProps) {
  const hours = draft.business.hours;
  const [removing, setRemoving] = useState<number | null>(null);
  const isLast = hours.length === 1;
  return (
    <div className={shared.stack}>
      {hours.map((entry, index) => (
        <HoursEntry
          key={index}
          entry={entry}
          canRemove={!isLast}
          onChange={(patch) => apply((c) => updateEntry(c, index, patch))}
          onRemove={() => setRemoving(index)}
        />
      ))}
      {isLast ? (
        <p className={shared.note}>The site needs at least one set of opening hours.</p>
      ) : null}
      <button
        type="button"
        className={`admin-button ${shared.secondary}`}
        onClick={() => apply((c) => setHours(c, [...c.business.hours, NEW_ENTRY]))}
      >
        Add opening hours
      </button>

      <ConfirmDialog
        open={removing !== null}
        title={`Remove ${(removing !== null && hours[removing]?.days) || "these hours"}?`}
        confirmLabel="Remove"
        onConfirm={() => {
          const index = removing;
          setRemoving(null);
          if (index === null) return;
          apply((c) =>
            c.business.hours.length > 1
              ? setHours(
                  c,
                  c.business.hours.filter((_, i) => i !== index),
                )
              : c,
          );
        }}
        onCancel={() => setRemoving(null)}
      >
        They disappear from the site once you publish.
      </ConfirmDialog>
    </div>
  );
}

interface HoursEntryProps {
  entry: OpeningHours;
  canRemove: boolean;
  onChange: (patch: Partial<OpeningHours>) => void;
  onRemove: () => void;
}

function HoursEntry({ entry, canRemove, onChange, onRemove }: HoursEntryProps) {
  const errors = entryErrors(entry);
  const toggleDay = (day: DayOfWeek, on: boolean) =>
    onChange({
      dayOfWeek: WEEK.filter((d) => (d === day ? on : entry.dayOfWeek.includes(d))),
    });

  return (
    <fieldset className={styles.entry}>
      <legend className={styles.legend}>{entry.days || "Opening hours"}</legend>
      <div className={shared.row}>
        <TextField
          label="Days label"
          value={entry.days}
          onChange={(days) => onChange({ days })}
          required
        />
        <TextField
          label="Short label"
          value={entry.shortDays}
          onChange={(shortDays) => onChange({ shortDays })}
          required
        />
      </div>
      <div>
        <span className="admin-label">Days</span>
        <div className={styles.days}>
          {WEEK.map((day) => (
            <label key={day} className={styles.day}>
              <input
                type="checkbox"
                checked={entry.dayOfWeek.includes(day)}
                onChange={(event) => toggleDay(day, event.target.checked)}
              />
              <span>{day.slice(0, 3)}</span>
            </label>
          ))}
        </div>
      </div>
      <div className={shared.row}>
        <TimeField label="Opens" value={entry.open} onChange={(open) => onChange({ open })} />
        <TimeField label="Closes" value={entry.close} onChange={(close) => onChange({ close })} />
        <TimeField
          label="Last appointment"
          value={entry.lastAppointment}
          onChange={(lastAppointment) => onChange({ lastAppointment })}
        />
      </div>
      {errors.map((error) => (
        <p key={error} className={fields.error}>
          {error}
        </p>
      ))}
      <button type="button" className={shared.textButton} disabled={!canRemove} onClick={onRemove}>
        Remove these hours
      </button>
    </fieldset>
  );
}

interface TimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function TimeField({ label, value, onChange }: TimeFieldProps) {
  const id = useId();
  return (
    <div className={fields.field}>
      <label className="admin-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="admin-input"
        type="time"
        value={value}
        // A cleared time input reports "": keep the last valid time in the draft.
        onChange={(event) => {
          if (/^\d{2}:\d{2}$/.test(event.target.value)) onChange(event.target.value);
        }}
      />
    </div>
  );
}
