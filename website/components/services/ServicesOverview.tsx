import Image from "next/image";
import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { cx } from "@/lib/cx";
import { OVERVIEW_IMAGES, PHOTOS, positionClass } from "@/lib/data/images";
import {
  CATEGORY_ORDER,
  MENU,
  categoryStats,
  totalServices,
  type CategoryKey,
} from "@/lib/data/services";
import { formatPrice, formatServiceCount } from "@/lib/format";
import { CategoryLink } from "./CategoryLink";
import styles from "./ServicesOverview.module.css";

const ICONS: Record<CategoryKey, ReactNode> = {
  cut: (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="18" r="3"></circle>
      <path d="M8.2 15.9 19 3M15.8 15.9 5 3"></path>
    </svg>
  ),
  colour: (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3c3.5 4.6 6 8 6 11a6 6 0 0 1-12 0c0-3 2.5-6.4 6-11z"></path>
    </svg>
  ),
  perm: (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7c3-3 6 3 9 0s6 3 9 0M3 12c3-3 6 3 9 0s6 3 9 0M3 17c3-3 6 3 9 0s6 3 9 0"></path>
    </svg>
  ),
  treat: (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M12 8.5 13.2 10.8 15.5 12 13.2 13.2 12 15.5 10.8 13.2 8.5 12 10.8 10.8z"></path>
    </svg>
  ),
};

export function ServicesOverview() {
  return (
    <section
      className={cx("slide scroll", styles.services)}
      id="services"
      data-tone="light"
      data-blur
      aria-labelledby="services-title"
    >
      <Reveal as="h2" className={styles.title} id="services-title">
        {/* The count is decoration (the cards state their own counts); the spaces keep the
            accessible name "Our Services" and are not rendered inside the flex container. */}
        <span>Our</span>{" "}
        <span className={styles.tag} aria-hidden="true">
          <span className={styles.tagIn}>{formatServiceCount(totalServices)}</span>
        </span>{" "}
        <span>Services</span>
      </Reveal>
      <div className={styles.grid}>
        {CATEGORY_ORDER.map((key) => {
          const category = MENU[key];
          const stats = categoryStats(category);
          const image = OVERVIEW_IMAGES[key];
          return (
            <CategoryLink key={key} category={key}>
              <span className={styles.media}>
                <span className={styles.go} aria-hidden="true">
                  View →
                </span>
                <Image
                  src={PHOTOS[image.photo].src}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className={positionClass(image.objectPosition)}
                />
              </span>
              <span className={styles.info}>
                <span className={styles.name}>{category.name}</span>
                <span className={styles.count}>
                  {formatServiceCount(stats.count)}
                  <span className={styles.from}>{` · from ${formatPrice(stats.from)}`}</span>
                </span>
                {ICONS[key]}
              </span>
            </CategoryLink>
          );
        })}
      </div>
    </section>
  );
}
