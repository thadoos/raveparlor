import Image from "next/image";
import { PHOTOS, SLIDE_POSITIONS } from "@/lib/data/images";

export function HeroPair() {
  return (
    <section className="slide pair is-current" id="top" data-tone="light">
      <div className="layer pair-grid">
        <figure className="half is-current" id="gallery" data-tone="light">
          <div className="layer">
            <Image
              src={PHOTOS.portraitColour.src}
              alt={PHOTOS.portraitColour.alt}
              fill
              sizes="(max-width: 820px) 100vw, 50vw"
              className="m-left"
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
        <div className="vignette pair-vignette"></div>
      </div>
    </section>
  );
}
