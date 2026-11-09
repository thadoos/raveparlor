"use client";

import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import type { CategoryKey } from "@/lib/data/services";
import { useReveal } from "@/lib/hooks/use-reveal";
import styles from "./ServicesOverview.module.css";
import { useServiceCategory } from "./services-context";

interface CategoryLinkProps {
  category: CategoryKey;
  children: ReactNode;
}

/**
 * A services overview card: picks that category in the service menu (without the entrance
 * animation) and lets the click through, so the deck's link handling scrolls to the menu.
 */
export function CategoryLink({ category, children }: CategoryLinkProps) {
  const { setCategory } = useServiceCategory();
  const { attach, className: revealClass } = useReveal();
  return (
    <a
      ref={attach}
      className={cx(styles.card, revealClass)}
      href="#service-menu"
      data-cat={category}
      onClick={() => setCategory(category, { animate: false })}
    >
      {children}
    </a>
  );
}
