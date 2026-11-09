import { SITE } from "@/lib/data/site";
import { formatGoogleReviews } from "@/lib/format";
import styles from "./DialogRating.module.css";

/** The salon's Google rating. */
export function DialogRating() {
  return (
    <p className={styles.rating}>
      <span aria-hidden="true">★★★★★</span> {`${SITE.googleRating.score} `}
      <span className={styles.src}>{formatGoogleReviews()}</span>
    </p>
  );
}
