import { BOOK_MESSAGE, whatsappLink } from "@/lib/contact";
import { SITE } from "@/lib/data/site";
import { formatGoogleReviews } from "@/lib/format";

export function ServiceModal() {
  return (
    <div className="md" id="md" aria-hidden="true">
      <div className="md-backdrop" data-close></div>
      <div
        className="md-panel"
        id="md-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="md-name"
      >
        <button className="md-close" type="button" aria-label="Close" data-close>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5l14 14M19 5 5 19"></path>
          </svg>
        </button>
        <div className="md-body">
          <div className="md-media"></div>
          <div className="md-text">
            <p className="md-rating">
              <span aria-hidden="true">★★★★★</span> {`${SITE.googleRating.score} `}
              <span className="md-rating-src">{formatGoogleReviews()}</span>
            </p>
            <p className="md-cat" id="md-cat"></p>
            <h3 className="md-name" id="md-name"></h3>
            <div className="md-price" id="md-price"></div>
            <div className="md-flip" id="md-flip">
              <div className="md-front" id="md-front">
                <div className="md-collapse">
                  <p className="md-desc" id="md-desc"></p>
                  <div className="md-block" id="md-ideal-wrap">
                    <h4>Ideal for</h4>
                    <p id="md-ideal"></p>
                  </div>
                  <div className="md-block" id="md-note-wrap">
                    <h4>Good to know</h4>
                    <p id="md-note"></p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md-actions">
              <a className="md-book" href={whatsappLink(BOOK_MESSAGE)}>
                Book now
              </a>
              <button className="md-back-btn" type="button" hidden>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
