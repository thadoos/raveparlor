"use client";

import { useMemo, type KeyboardEvent, type MouseEvent } from "react";
import { bookingHref } from "@/lib/booking/href";
import { cx } from "@/lib/cx";
import {
  MENU,
  cardAriaLabel,
  isPickable,
  priceLabel,
  type CategoryKey,
  type MenuItem,
} from "@/lib/data/services";
import styles from "./ServiceGrid.module.css";
import { useServiceDialog } from "./services-context";

interface ServiceCardProps {
  categoryKey: CategoryKey;
  index: number;
  item: MenuItem;
  /** Play the entrance animation. */
  animate: boolean;
}

/**
 * A service card. Anywhere on it opens the details; "Book now" opens them straight in the booking
 * step when there is something to choose, and otherwise goes to WhatsApp.
 */
export function ServiceCard({ categoryKey, index, item, animate }: ServiceCardProps) {
  const { state, open, registerCard } = useServiceDialog();
  const category = MENU[categoryKey];
  const ref = useMemo(() => registerCard(categoryKey, index), [registerCard, categoryKey, index]);
  const price = priceLabel(item);
  const pickable = isPickable(item, category);
  // the card stays hidden behind the dialog that expands out of it
  const target = state.target;
  const hidden =
    state.stage !== "closed" &&
    state.animated &&
    target?.category === categoryKey &&
    target.index === index;

  function openDetails(picking: boolean) {
    open({ category: categoryKey, index, picking });
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
      e.preventDefault();
      openDetails(false);
    }
  }

  function onBookNow(e: MouseEvent<HTMLAnchorElement>) {
    // handled here, not by the card: without choices the link goes straight to WhatsApp
    e.stopPropagation();
    if (!pickable) return;
    e.preventDefault();
    openDetails(true);
  }

  return (
    <article
      ref={ref}
      className={cx(styles.card, animate && styles.enter)}
      tabIndex={0}
      data-i={index}
      data-open={hidden ? "" : undefined}
      aria-label={cardAriaLabel(item)}
      onClick={() => openDetails(false)}
      onKeyDown={onKeyDown}
    >
      <h3>{item.name}</h3>
      <div className={styles.price}>
        {price.prefix && <small>{price.prefix}</small>}
        {price.text}
      </div>
      <p>{item.desc}</p>
      <div className={styles.actions}>
        <a
          className={styles.booknow}
          href={bookingHref({ item, category, selection: null })}
          onClick={onBookNow}
        >
          Book now
        </a>
        <button className={styles.more} type="button">
          Learn more
        </button>
      </div>
    </article>
  );
}
