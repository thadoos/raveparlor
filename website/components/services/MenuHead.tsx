"use client";

import { MENU } from "@/lib/data/services";
import styles from "./MenuHead.module.css";
import { useServiceCategory } from "./services-context";

/** Title and intro of the active category. */
export function MenuHead() {
  const { category } = useServiceCategory();
  const { name, intro } = MENU[category];
  return (
    <div className={styles.head}>
      <h2 className={styles.title} id="mn-title">
        {name}
      </h2>
      <div className={styles.intro} id="mn-intro">
        {intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
