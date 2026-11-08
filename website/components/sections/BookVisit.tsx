export function BookVisit() {
  return (
    <section className="visit" id="book" data-tone="dark" aria-labelledby="book-title">
      <div className="visit-grid">
        <h2 id="book-title" className="reveal">
          Book &amp; Visit
        </h2>
        <div className="reveal">
          <h3>Appointments</h3>
          <p>
            By appointment
            <br />
            Phone <a href="tel:+447789096148">07789 096148</a>
            <br />
            WhatsApp 07871 311 362
          </p>
          <a className="cta" href="https://wa.me/447871311362">
            Book on WhatsApp
          </a>
        </div>
        <div className="reveal">
          <h3>Opening hours</h3>
          <p>
            Open daily
            <br />
            10:00 – 19:00
            <br />
            Last appointment 18:00
          </p>
        </div>
        <div className="reveal">
          <h3>Find us</h3>
          <p>
            15 Coombe Road
            <br />
            New Malden KT3 4QG
          </p>
          <p
            style={{
              marginTop: "10px",
              color: "#a6a6a3",
              fontSize: "12px",
              letterSpacing: ".08em",
            }}
          >
            4.9 on Google · 200 reviews
          </p>
          <a className="cta" href="https://maps.app.goo.gl/5DsbgsoeiHCW4rab9">
            Directions
          </a>
        </div>
      </div>
    </section>
  );
}
