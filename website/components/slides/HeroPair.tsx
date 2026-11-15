import Image from "next/image";
import { Editable } from "@/components/edit/Editable";
import { cx } from "@/lib/cx";
import type { Hero } from "@/lib/content/schema";
import type { ResolvedImage } from "@/lib/content/view";
import styles from "./HeroPair.module.css";

interface HeroPairProps {
  left: ResolvedImage;
  right: ResolvedImage;
  hero: Hero;
}

export function HeroPair({ left, right, hero }: HeroPairProps) {
  return (
    <section className="slide pair is-current" id="top" data-tone="light">
      <div className={cx("layer", styles.pairGrid)}>
        <figure className="half is-current" id="gallery" data-tone="light">
          <div className="layer">
            <Editable target={{ kind: "image", slot: "heroLeft" }}>
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
            </Editable>
            <div className="topfade"></div>
            <div className="vignette"></div>
            <div className="scrim"></div>
            <figcaption className="cap">
              <Editable target={{ kind: "hero" }}>
                <strong>{hero.left.title}</strong>
                <a href="#services">Book an appointment</a>
              </Editable>
            </figcaption>
          </div>
        </figure>
        <figure className="half" data-tone="light">
          <div className="layer">
            <Editable target={{ kind: "image", slot: "heroRight" }}>
              <Image
                src={right.src}
                alt={right.alt}
                fill
                sizes="(max-width: 820px) 100vw, 50vw"
                style={{ objectPosition: right.position }}
                loading="eager"
                fetchPriority="high"
              />
            </Editable>
            <div className="topfade"></div>
            <div className="vignette"></div>
            <div className="scrim"></div>
            <figcaption className="cap">
              <Editable target={{ kind: "hero" }}>
                <strong>{hero.right.title}</strong>
                <a href="#prices">See prices</a>
              </Editable>
            </figcaption>
          </div>
        </figure>
        <div className={cx("vignette", styles.pairVignette)}></div>
      </div>
    </section>
  );
}
