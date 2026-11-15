import { Editable } from "@/components/edit/Editable";
import { cx } from "@/lib/cx";
import type { SiteInfo } from "@/lib/data/site";
import type { SiteView } from "@/lib/content/view";
import { formatGoogleReviews } from "@/lib/format";
import { ReviewsCarousel } from "./ReviewsCarousel";
import styles from "./ReviewsSlide.module.css";

interface ReviewsSlideProps {
  site: SiteInfo;
  reviews: SiteView["reviews"];
}

export function ReviewsSlide({ site, reviews }: ReviewsSlideProps) {
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
        <Editable target={{ kind: "reviews" }}>
          <ReviewsCarousel reviews={reviews.items} />
        </Editable>
        <p className={styles.rating}>
          <Editable target={{ kind: "reviews" }}>
            <a
              className={styles.link}
              href={site.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.stars} aria-hidden="true">
                {"★".repeat(reviews.stars)}
              </span>
              <span className={styles.score}>
                {`${site.googleRating.score} out of 5 ${formatGoogleReviews(site)}`}
              </span>
              <span className={styles.more}>Read them on Google</span>
            </a>
          </Editable>
        </p>
      </div>
    </section>
  );
}
