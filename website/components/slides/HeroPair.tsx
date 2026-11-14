import Image from "next/image";
import { cx } from "@/lib/cx";
import type { ResolvedImage } from "@/lib/content/view";
import styles from "./HeroPair.module.css";

interface HeroPairProps {
  left: ResolvedImage;
  right: ResolvedImage;
}

export function HeroPair({ left, right }: HeroPairProps) {
  return (
    <section className="slide pair is-current" id="top" data-tone="light">
      <div className={cx("layer", styles.pairGrid)}>
        <figure className="half is-current" id="gallery" data-tone="light">
          <div className="layer">
            <Image
              src={left.src}
              alt={left.alt}
              fill
              sizes="(max-width: 820px) 100vw, 50vw"
              className={styles.mLeft}
              style={{ objectPosition: left.position }}
              loading="eager"
              fetchPriority="high"
            />
            <div className="topfade"></div>
            <div className="vignette"></div>
            <div className="scrim"></div>
            <figcaption className="cap">
              <strong>Cutting &amp; Finishing</strong>
              <a href="#book">Book an appointment</a>
            </figcaption>
          </div>
        </figure>
        <figure className="half" data-tone="light">
          <div className="layer">
            <Image
              src={right.src}
              alt={right.alt}
              fill
              sizes="(max-width: 820px) 100vw, 50vw"
              style={{ objectPosition: right.position }}
              loading="eager"
              fetchPriority="high"
            />
            <div className="topfade"></div>
            <div className="vignette"></div>
            <div className="scrim"></div>
            <figcaption className="cap">
              <strong>Full Head Colour</strong>
              <a href="#prices">See prices</a>
            </figcaption>
          </div>
        </figure>
        <div className={cx("vignette", styles.pairVignette)}></div>
      </div>
    </section>
  );
}
