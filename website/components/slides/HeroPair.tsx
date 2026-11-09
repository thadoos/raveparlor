import Image from "next/image";
import { cx } from "@/lib/cx";
import { PHOTOS, SLIDE_POSITIONS } from "@/lib/data/images";
import styles from "./HeroPair.module.css";

export function HeroPair() {
  return (
    <section className="slide pair is-current" id="top" data-tone="light">
      <div className={cx("layer", styles.pairGrid)}>
        <figure className="half is-current" id="gallery" data-tone="light">
          <div className="layer">
            <Image
              src={PHOTOS.portraitColour.src}
              alt={PHOTOS.portraitColour.alt}
              fill
              sizes="(max-width: 820px) 100vw, 50vw"
              className={styles.mLeft}
              style={{ objectPosition: SLIDE_POSITIONS.heroLeft }}
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
              src={PHOTOS.bobCopper.src}
              alt={PHOTOS.bobCopper.alt}
              fill
              sizes="(max-width: 820px) 100vw, 50vw"
              style={{ objectPosition: SLIDE_POSITIONS.heroRight }}
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
