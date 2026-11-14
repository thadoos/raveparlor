"use client";

import { useId, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  applyRowDropsLastPrice,
  applyRowToAllBarbers,
  NEEDS_PRICE,
  setByBarber,
  setByBarberDropsLastPrice,
  setPrice,
  setPriceDropsLastPrice,
} from "@/lib/admin/draft-ops";
import type { Barber, CategoryKey, ItemContent } from "@/lib/content/schema";
import { PriceField } from "./PriceField";
import type { EditorProps } from "./types";
import fields from "./fields.module.css";
import styles from "./PriceGrid.module.css";

interface PriceGridProps extends EditorProps {
  category: CategoryKey;
  item: string;
}

const NOT_OFFERED = "–";

function sameRow(a: readonly string[] | undefined, b: readonly string[] | undefined): boolean {
  return (
    a !== undefined && b !== undefined && a.length === b.length && a.every((v, i) => v === b[i])
  );
}

function barberRow(data: ItemContent, id: string): string[] | undefined {
  const rows = data.prices.barbers;
  return rows && Object.hasOwn(rows, id) ? rows[id] : undefined;
}

/** Whether every barber's row matches the given one (so copying it changes nothing). */
function allMatch(data: ItemContent, barbers: readonly Barber[], row: string[] | undefined) {
  return barbers.every((b) => sameRow(barberRow(data, b.id), row));
}

/**
 * The "Barber option" switch: whether this service's prices depend on the barber. Turning it off
 * keeps the first barber's prices for everyone, so that asks first when the barbers differ.
 */
export function BarberOptionToggle({ draft, apply, category, item }: PriceGridProps) {
  const labelId = useId();
  const [confirming, setConfirming] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const data = draft.services[category].items[item];
  const first = draft.barbers.at(0);
  const on = data.byBarber;

  const set = (next: boolean) => apply((c) => setByBarber(c, category, item, next));

  function toggle() {
    const lastPrice = on && setByBarberDropsLastPrice(draft, category, item, false);
    setBlocked(lastPrice);
    if (lastPrice) return;
    if (on && first && !allMatch(data, draft.barbers, barberRow(data, first.id))) {
      setConfirming(true);
    } else set(!on);
  }

  return (
    <div className={styles.toggleRow}>
      <div>
        <p id={labelId} className={styles.toggleLabel}>
          Barber option
        </p>
        <p className={styles.toggleHint}>Prices depend on which barber the client books.</p>
        {blocked ? (
          <p className={fields.error} role="alert">
            {NEEDS_PRICE} {first?.name ?? "The first barber"} has no prices for it, and only their
            prices would be kept.
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        className={styles.switch}
        onClick={toggle}
      >
        <span className={styles.thumb} aria-hidden="true" />
      </button>

      <ConfirmDialog
        open={confirming}
        title={`Use ${first?.name ?? "the first barber"}'s prices for everyone?`}
        confirmLabel="Turn off"
        onConfirm={() => {
          set(false);
          setConfirming(false);
        }}
        onCancel={() => setConfirming(false)}
      >
        The barbers have different prices for this service. Only the first barber&apos;s are kept.
      </ConfirmDialog>
    </div>
  );
}

/**
 * The service's prices: one row, or one per barber, by one column per option (or a single
 * "Price" column). Scrolls sideways inside its own box when it doesn't fit.
 */
export function PriceGrid({ draft, apply, category, item }: PriceGridProps) {
  const [copying, setCopying] = useState<Barber | null>(null);
  const [blocked, setBlocked] = useState(false);
  const data = draft.services[category].items[item];
  const columns = data.options.length > 0 ? data.options : ["Price"];
  const rows: { barber: Barber | null; cells: readonly string[] }[] = data.byBarber
    ? draft.barbers.map((barber) => ({ barber, cells: barberRow(data, barber.id) ?? [] }))
    : [{ barber: null, cells: data.prices.base ?? [] }];

  const label = (barber: Barber | null, column: string) =>
    barber ? `${barber.name}, ${column}` : column;

  return (
    <div>
      <div className={styles.scroller}>
        <table className={styles.grid}>
          <thead>
            <tr>
              {data.byBarber ? (
                <th scope="col" className={styles.head}>
                  Barber
                </th>
              ) : null}
              {columns.map((column) => (
                <th key={column} scope="col" className={styles.head}>
                  {column}
                </th>
              ))}
              {data.byBarber ? (
                <th scope="col" className={styles.head}>
                  <span className={styles.hidden}>Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ barber, cells }) => (
              <tr key={barber?.id ?? "base"}>
                {barber ? (
                  <th scope="row" className={styles.rowHead}>
                    {barber.name}
                  </th>
                ) : null}
                {columns.map((column, index) => (
                  <td key={column} className={styles.cell}>
                    <PriceField
                      label={label(barber, column)}
                      hideLabel
                      value={cells.at(index) ?? NOT_OFFERED}
                      accept={(price) => {
                        const id = barber?.id ?? null;
                        const lastPrice = setPriceDropsLastPrice(
                          draft,
                          category,
                          item,
                          id,
                          index,
                          price,
                        );
                        setBlocked(lastPrice);
                        return !lastPrice;
                      }}
                      onChange={(price) =>
                        apply((c) => setPrice(c, category, item, barber?.id ?? null, index, price))
                      }
                    />
                  </td>
                ))}
                {barber ? (
                  <td className={styles.cell}>
                    <button
                      type="button"
                      className={styles.apply}
                      aria-label={`Apply ${barber.name}'s prices to all barbers`}
                      disabled={allMatch(data, draft.barbers, barberRow(data, barber.id))}
                      onClick={() => {
                        const lastPrice = applyRowDropsLastPrice(draft, category, item, barber.id);
                        setBlocked(lastPrice);
                        if (!lastPrice) setCopying(barber);
                      }}
                    >
                      Apply to all barbers
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {blocked ? (
        <p className={fields.error} role="alert">
          {NEEDS_PRICE} Not every cell can be – (not offered).
        </p>
      ) : null}

      <ConfirmDialog
        open={copying !== null}
        title={`Give every barber ${copying?.name ?? "this barber"}'s prices?`}
        confirmLabel="Apply"
        onConfirm={() => {
          if (copying) {
            const id = copying.id;
            apply((c) => applyRowToAllBarbers(c, category, item, id));
          }
          setCopying(null);
        }}
        onCancel={() => setCopying(null)}
      >
        The other barbers&apos; prices for this service are replaced.
      </ConfirmDialog>
    </div>
  );
}
