import { BOOK_MESSAGE, whatsappLink } from "@/lib/contact";

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
            By appointment only
            <br />
            WhatsApp 07789 096148
          </p>
          <a className="cta" href={whatsappLink(BOOK_MESSAGE)}>
            Book on WhatsApp
          </a>
        </div>
        <div className="reveal">
          <h3>Opening hours</h3>
          <p>
            Mon – Sat 10:00 – 19:00
            <br />
            Last appointment 18:00
            <br />
            Sunday 10:00 – 18:00
            <br />
            Last appointment 17:00
          </p>
          <p
            style={{
              marginTop: "10px",
              color: "#a6a6a3",
              fontSize: "12px",
              letterSpacing: ".08em",
            }}
          >
            Closed Christmas Day, Boxing Day and New Year’s Day
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
