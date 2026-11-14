import { cx } from "@/lib/cx";
import { REVIEWS } from "@/lib/data/reviews";
import type { SiteInfo } from "@/lib/data/site";
import { formatGoogleReviews } from "@/lib/format";
import { ReviewsCarousel } from "./ReviewsCarousel";
import styles from "./ReviewsSlide.module.css";

interface ReviewsSlideProps {
  site: SiteInfo;
}

export function ReviewsSlide({ site }: ReviewsSlideProps) {
  return (
    <section
      className={cx("slide", styles.reviews)}
      id="reviews"
      data-tone="light"
      aria-labelledby="reviews-title"
    >
      <h2 id="reviews-title" className="sr">
        Google reviews
      </h2>
      <div className={styles.column}>
        <ReviewsCarousel reviews={REVIEWS} />
        <p className={styles.rating}>
          <a className={styles.link} href={site.mapsUrl} target="_blank" rel="noopener noreferrer">
            <span className={styles.stars} aria-hidden="true">
              ★★★★★
            </span>
            <span className={styles.score}>
              {`${site.googleRating.score} out of 5 ${formatGoogleReviews(site)}`}
            </span>
            <span className={styles.more}>Read them on Google</span>
          </a>
        </p>
      </div>
    </section>
  );
}
