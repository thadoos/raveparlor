import Image from "next/image";

export function HeroPair() {
  return (
    <section className="slide pair is-current" id="top" data-tone="light">
      <div className="layer pair-grid">
        <figure className="half is-current" id="gallery" data-tone="light">
          <div className="layer">
            <Image
              src="/images/portrait-colour.jpg"
              alt="Client with a sleek shoulder-length cut on a rooftop at golden hour"
              fill
              sizes="(max-width: 820px) 100vw, 50vw"
              className="m-left"
              style={{ objectPosition: "46% 42%" }}
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
              src="/images/bob-copper.jpg"
              alt="Client with a copper bob, eyes lowered"
              fill
              sizes="(max-width: 820px) 100vw, 50vw"
              style={{ objectPosition: "50% 38%" }}
              loading="eager"
              fetchPriority="high"
            />
            <div className="topfade"></div>
            <div className="vignette"></div>
            <div className="scrim"></div>
            <figcaption className="cap">
              <strong>Tinting Colour</strong>
              <a href="#prices">See prices</a>
            </figcaption>
          </div>
        </figure>
        <div className="vignette pair-vignette"></div>
      </div>
    </section>
  );
}
