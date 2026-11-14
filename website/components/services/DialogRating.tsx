import type { SiteInfo } from "@/lib/data/site";
import { formatGoogleReviews } from "@/lib/format";
import styles from "./DialogRating.module.css";

interface DialogRatingProps {
  site: SiteInfo;
}

/** The salon's Google rating. */
export function DialogRating({ site }: DialogRatingProps) {
  return (
    <p className={styles.rating}>
      <span aria-hidden="true">★★★★★</span> {`${site.googleRating.score} `}
      <span className={styles.src}>{formatGoogleReviews(site)}</span>
    </p>
  );
}
