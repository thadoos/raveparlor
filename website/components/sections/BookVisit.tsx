import { Fragment } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { BOOK_MESSAGE, whatsappLink } from "@/lib/contact";
import { SITE } from "@/lib/data/site";
import {
  formatAddressLines,
  formatClosedDays,
  formatHours,
  formatLastAppointment,
  formatRatingLine,
  formatWhatsAppLine,
} from "@/lib/format";
import styles from "./BookVisit.module.css";

export function BookVisit() {
  return (
    <section className={styles.visit} id="book" data-tone="dark" aria-labelledby="book-title">
      <div className={styles.grid}>
        <Reveal as="h2" id="book-title">
          Book &amp; Visit
        </Reveal>
        <Reveal>
          <h3>Appointments</h3>
          <p>
            By appointment only
            <br />
            {formatWhatsAppLine()}
          </p>
          <a className={styles.cta} href={whatsappLink(BOOK_MESSAGE)}>
            Book on WhatsApp
          </a>
        </Reveal>
        <Reveal>
          <h3>Opening hours</h3>
          <p>
            {SITE.hours.map((hours, i) => (
              <Fragment key={hours.days}>
                {i > 0 && <br />}
                {formatHours(hours)}
                <br />
                {formatLastAppointment(hours)}
              </Fragment>
            ))}
          </p>
          <p className={styles.note}>{formatClosedDays()}</p>
        </Reveal>
        <Reveal>
          <h3>Find us</h3>
          <p>
            {formatAddressLines()[0]}
            <br />
            {formatAddressLines()[1]}
          </p>
          <p className={styles.note}>{formatRatingLine()}</p>
          <a className={styles.cta} href={SITE.mapsUrl}>
            Directions
          </a>
        </Reveal>
      </div>
    </section>
  );
}
