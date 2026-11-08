import Image from "next/image";

export function ParlorSlide() {
  return (
    <section className="slide" id="parlor" data-tone="dark">
      <div className="layer">
        <Image
          src="/images/parlor-reception.jpg"
          alt="Rave’s Parlor reception desk and salon floor"
          fill
          sizes="100vw"
          className="m-reception"
          style={{ objectPosition: "50% 50%" }}
          loading="eager"
        />
        <div className="scrim"></div>
        <div className="wordmark" aria-hidden="true">
          <span className="wordmark-name">RAVE’S PARLOR</span>
          <span className="wordmark-city">LONDON</span>
        </div>
        <div className="cap">
          <strong>15 Coombe Road, New Malden</strong>Open daily · 10:00 – 19:00
        </div>
      </div>
    </section>
  );
}
