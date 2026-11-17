"use client";

import { Fragment, type CSSProperties } from "react";
import { useSiteView } from "@/components/site/site-view-context";
import { Reveal } from "@/components/ui/Reveal";
import { cx } from "@/lib/cx";
import type { Barber } from "@/lib/content/schema";
import {
  CATEGORY_ORDER,
  displayedRows,
  isPrice,
  type MenuCategory,
  type MenuItem,
} from "@/lib/data/services";
import styles from "./PriceList.module.css";

/** The longest option list among the category's items (the first wins on ties). */
function headerOptions(category: MenuCategory): readonly string[] {
  let header: readonly string[] = [];
  for (const item of category.items) {
    if (item.options.length > header.length) header = item.options;
  }
  return header;
}

function fitsHeader(item: MenuItem, header: readonly string[]): boolean {
  return item.options.length > 0 && item.options.every((o, i) => o === header[i]);
}

function labels(options: readonly string[], cols: number): string[] {
  return Array.from({ length: cols }, (_, i) => options[i] ?? "");
}

interface PriceCellsProps {
  item: MenuItem;
  prices: readonly string[];
  cols: number;
  captions?: boolean;
}

function PriceCells({ item, prices, cols, captions }: PriceCellsProps) {
  if (item.options.length === 0) return <span className={styles.span}>{prices[0]}</span>;
  return (
    <>
      {Array.from({ length: cols }, (_, i) => {
        const value = prices[i];
        if (captions) {
          if (i >= item.options.length) return <span key={i} />;
          return (
            <span key={i} className={isPrice(value) ? undefined : styles.none}>
              {isPrice(value) ? value : "–"}
              <small className={styles.caption}>{item.options[i]}</small>
            </span>
          );
        }
        return isPrice(value) ? (
          <span key={i}>{value}</span>
        ) : (
          <span key={i} className={styles.none}>
            –
          </span>
        );
      })}
    </>
  );
}

interface ItemRowsProps {
  item: MenuItem;
  header: readonly string[];
  cols: number;
  grouped: boolean;
}

function ItemRows({ item, header, cols, grouped }: ItemRowsProps) {
  const rows = displayedRows(item);
  const ownHead = !grouped && item.options.length > 0 && !fitsHeader(item, header);
  return (
    <>
      {ownHead && <OwnHead item={item} cols={cols} />}
      <div className={styles.row}>
        <div>{item.name}</div>
        <PriceCells item={item} prices={rows[0].prices} cols={cols} captions={grouped && !fitsHeader(item, header)} />
      </div>
    </>
  );
}

interface OwnHeadProps {
  item: MenuItem;
  cols: number;
}

function OwnHead({ item, cols }: OwnHeadProps) {
  return (
    <div className={cx(styles.row, styles.subHead)}>
      <div />
      {labels(item.options, cols).map((label, i) => (
        <span key={i}>{label}</span>
      ))}
    </div>
  );
}

interface BarberBlockProps {
  barber: Barber;
  items: readonly MenuItem[];
  header: readonly string[];
  cols: number;
}

function BarberBlock({ barber, items, header, cols }: BarberBlockProps) {
  return (
    <>
      <div className={cx(styles.row, styles.barberHead)}>
        <h4>
          {barber.name}
          <small>Available: {barber.days}</small>
        </h4>
      </div>
      {items.map((item) => {
        const row = item.rows.find((r) => r.barberId === barber.id);
        if (!row) return null;
        return (
          <div className={styles.row} key={item.key}>
            <div>{item.name}</div>
            <PriceCells item={item} prices={row.prices} cols={cols} captions={!fitsHeader(item, header)} />
          </div>
        );
      })}
    </>
  );
}

interface PriceGroupProps {
  category: MenuCategory;
  barbers: readonly Barber[];
}

function PriceGroup({ category, barbers }: PriceGroupProps) {
  const header = headerOptions(category);
  const cols = Math.max(1, header.length);
  const barberItems = category.items.filter((item) => item.byBarber);
  const otherItems = category.items.filter((item) => !item.byBarber);
  const listedBarbers = barbers.filter((barber) =>
    barberItems.some((item) => item.rows.some((r) => r.barberId === barber.id)),
  );
  const notes = [
    ...new Set(
      category.items.map((item) => item.note).filter((note): note is string => !!note),
    ),
  ];
  const grouped = barberItems.length > 0;
  return (
    <div style={{ "--cols": cols } as CSSProperties}>
      <div className={cx(styles.row, styles.headRow)}>
        <h3>{category.name}</h3>
        {labels(header, cols).map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      {otherItems.map((item) => (
        <Fragment key={item.key}>
          <ItemRows item={item} header={header} cols={cols} grouped={grouped} />
        </Fragment>
      ))}
      {listedBarbers.map((barber) => (
        <BarberBlock key={barber.id} barber={barber} items={barberItems} header={header} cols={cols} />
      ))}
      {notes.map((note) => (
        <p className={styles.groupNote} key={note}>
          {note}
        </p>
      ))}
    </div>
  );
}

export function PriceList() {
  const { menu, barbers } = useSiteView();
  return (
    <section
      className={styles.prices}
      id="prices"
      data-tone="light"
      data-blur
      aria-labelledby="prices-title"
    >
      <div className={styles.wrap}>
        <Reveal as="p" className={styles.eyebrow}>
          Rave’s Parlor London
        </Reveal>
        <Reveal as="h2" className={styles.title} id="prices-title">
          Price List
        </Reveal>

        {CATEGORY_ORDER.map((key) => (
          <Reveal className={styles.group} key={key}>
            <PriceGroup category={menu[key]} barbers={barbers} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
