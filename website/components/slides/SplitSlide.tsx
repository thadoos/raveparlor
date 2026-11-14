import Image from "next/image";
import { Editable } from "@/components/edit/Editable";
import { cx } from "@/lib/cx";
import type { ResolvedImage } from "@/lib/content/view";
import styles from "./SplitSlide.module.css";

interface SplitSlideProps {
  image: ResolvedImage;
}

export function SplitSlide({ image }: SplitSlideProps) {
  return (
    <section className={cx("slide", styles.split)} data-tone="light" data-tone-m="dark">
      <div className={cx("layer", styles.grid)}>
        <figure>
          <Editable target={{ kind: "image", slot: "split" }}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 820px) 100vw, 50vw"
              style={{ objectPosition: image.position }}
              loading="eager"
            />
          </Editable>
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
