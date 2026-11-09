"use client";

import { MENU } from "@/lib/data/services";
import { useReducedMotion } from "@/lib/hooks/use-media";
import { ServiceCard } from "./ServiceCard";
import { ServiceMedia } from "./ServiceMedia";
import styles from "./ServiceGrid.module.css";
import { useServiceCategory } from "./services-context";

/**
 * The active category's photo and service cards. CSS lays the grid out from the number of
 * services (`data-n`). The cards are keyed by `token`, so every tab press renders them fresh and
 * replays the entrance animation.
 */
export function ServiceGrid() {
  const { category: key, animate: wantsAnimation, token } = useServiceCategory();
  const reducedMotion = useReducedMotion();
  const category = MENU[key];
  const animate = wantsAnimation && !reducedMotion;

  return (
    <div
      className={styles.grid}
      id="mn-grid"
      role="tabpanel"
      aria-labelledby="mn-title"
      data-n={category.items.length}
    >
      <ServiceMedia
        key={`${token}:media`}
        src={category.media}
        position={category.mediaPos}
        tall={category.items.length >= 2}
        animate={animate}
      />
      {category.items.map((item, index) => (
        <ServiceCard
          key={`${token}:${index}`}
          categoryKey={key}
          index={index}
          item={item}
          animate={animate}
        />
      ))}
    </div>
  );
}
