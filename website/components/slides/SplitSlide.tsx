import Image from "next/image";
import { cx } from "@/lib/cx";
import { PHOTOS, SLIDE_POSITIONS } from "@/lib/data/images";
import styles from "./SplitSlide.module.css";

export function SplitSlide() {
  return (
    <section className={cx("slide", styles.split)} data-tone="light" data-tone-m="dark">
      <div className={cx("layer", styles.grid)}>
        <figure>
          <Image
            src={PHOTOS.portraitMono.src}
            alt={PHOTOS.portraitMono.alt}
            fill
            sizes="(max-width: 820px) 100vw, 50vw"
            style={{ objectPosition: SLIDE_POSITIONS.split }}
            loading="eager"
          />
          <div className="scrim"></div>
          <figcaption className="cap">
            <strong>By appointment</strong>
            <a href="#prices">View the price list</a>
          </figcaption>
        </figure>
        <div className={styles.text}>
          <p>Cut · Colour · Perm · Treatment</p>
          <h2>By Appointment</h2>
          <a href="#prices">View the price list</a>
        </div>
      </div>
    </section>
  );
}
