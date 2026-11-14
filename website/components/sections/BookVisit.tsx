import { Fragment } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { BOOK_MESSAGE, whatsappLink } from "@/lib/contact";
import type { SiteInfo } from "@/lib/data/site";
import {
  formatAddressLines,
  formatClosedDays,
  formatHours,
  formatLastAppointment,
  formatRatingLine,
  formatWhatsAppLine,
} from "@/lib/format";
import styles from "./BookVisit.module.css";

interface BookVisitProps {
  site: SiteInfo;
}

export function BookVisit({ site }: BookVisitProps) {
  const [street, townLine] = formatAddressLines(site);
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
            {formatWhatsAppLine(site)}
          </p>
          <a
            className={styles.cta}
            href={whatsappLink(BOOK_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book on WhatsApp
          </a>
        </Reveal>
        <Reveal>
          <h3>Opening hours</h3>
          <p>
            {site.hours.map((hours, i) => (
              <Fragment key={hours.days}>
                {i > 0 && <br />}
                {formatHours(hours)}
                <br />
                {formatLastAppointment(hours)}
              </Fragment>
            ))}
          </p>
          <p className={styles.note}>{formatClosedDays(site)}</p>
        </Reveal>
        <Reveal>
          <h3>Find us</h3>
          <p>
            {street}
            <br />
            {townLine}
          </p>
          <p className={styles.note}>{formatRatingLine(site)}</p>
          <a className={styles.cta} href={site.mapsUrl}>
            Directions
          </a>
        </Reveal>
      </div>
    </section>
  );
}
