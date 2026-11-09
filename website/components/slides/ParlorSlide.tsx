import Image from "next/image";
import { PHOTOS, SLIDE_POSITIONS } from "@/lib/data/images";
import { formatAddressShort, formatHoursSummary } from "@/lib/format";

export function ParlorSlide() {
  return (
    <section className="slide" id="parlor" data-tone="dark">
      <div className="layer">
        <Image
          src={PHOTOS.parlorReception.src}
          alt={PHOTOS.parlorReception.alt}
          fill
          sizes="100vw"
          className="m-reception"
          style={{ objectPosition: SLIDE_POSITIONS.parlor }}
          loading="eager"
        />
        <div className="scrim"></div>
        <div className="wordmark" aria-hidden="true">
          <span className="wordmark-logo">
            <span className="logo-mark"></span>
          </span>
        </div>
        <div className="cap">
          <strong>{formatAddressShort()}</strong>
          {formatHoursSummary(" · ")}
        </div>
      </div>
    </section>
  );
}
