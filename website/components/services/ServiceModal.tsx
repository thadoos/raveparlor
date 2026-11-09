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
              <span aria-hidden="true">★★★★★</span> 4.9{" "}
              <span className="md-rating-src">· 200 Google reviews</span>
            </p>
            <p className="md-cat" id="md-cat"></p>
            <h3 className="md-name" id="md-name"></h3>
            <div className="md-price" id="md-price"></div>
            <p className="md-desc" id="md-desc"></p>
            <div className="md-block" id="md-ideal-wrap">
              <h4>Ideal for</h4>
              <p id="md-ideal"></p>
            </div>
            <div className="md-block" id="md-note-wrap">
              <h4>Good to know</h4>
              <p id="md-note"></p>
            </div>
            <div className="md-actions">
              <a className="md-book" href="#book" data-close-nav>
                Book now
              </a>
              <a className="md-wa" href="https://wa.me/447789096148">
                WhatsApp 07789 096148
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
