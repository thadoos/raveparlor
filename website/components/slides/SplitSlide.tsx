import Image from "next/image";
import { PHOTOS, SLIDE_POSITIONS } from "@/lib/data/images";

export function SplitSlide() {
  return (
    <section className="slide split" data-tone="light" data-tone-m="dark">
      <div className="layer split-grid">
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
        <div className="split-text">
          <p>Cut · Colour · Perm · Treatment</p>
          <h2>By Appointment</h2>
          <a href="#prices">View the price list</a>
        </div>
      </div>
    </section>
  );
}
