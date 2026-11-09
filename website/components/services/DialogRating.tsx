import { SITE } from "@/lib/data/site";
import { formatGoogleReviews } from "@/lib/format";

/** The salon's Google rating. */
export function DialogRating() {
  return (
    <p className="md-rating">
      <span aria-hidden="true">★★★★★</span> {`${SITE.googleRating.score} `}
      <span className="md-rating-src">{formatGoogleReviews()}</span>
    </p>
  );
}
