import Image from "next/image";
import type { ResolvedImage } from "@/lib/content/view";
import type { SiteInfo } from "@/lib/data/site";
import { formatAddressShort, formatHoursSummary } from "@/lib/format";
import styles from "./ParlorSlide.module.css";

interface ParlorSlideProps {
  site: SiteInfo;
  image: ResolvedImage;
}

export function ParlorSlide({ site, image }: ParlorSlideProps) {
  return (
    <section className="slide" id="parlor" data-tone="dark">
      <div className="layer">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="100vw"
          className={styles.reception}
          style={{ objectPosition: image.position }}
          loading="eager"
        />
        <div className="scrim"></div>
        <div className="wordmark" aria-hidden="true">
          <span className="wordmark-logo">
            <span className="logo-mark"></span>
          </span>
        </div>
        <div className="cap">
          <strong>{formatAddressShort(site)}</strong>
          {formatHoursSummary(site, " · ")}
        </div>
      </div>
    </section>
  );
}
