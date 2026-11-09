import { SITE, type OpeningHours } from "@/lib/data/site";

/** "Mon – Sat 10:00 – 19:00" (set `short` to use the abbreviated day label, e.g. "Sun"). */
export function formatHours(hours: OpeningHours, short = false): string {
  return `${short ? hours.shortDays : hours.days} ${hours.open} – ${hours.close}`;
}

/** "Last appointment 18:00" */
export function formatLastAppointment(hours: OpeningHours): string {
  return `Last appointment ${hours.lastAppointment}`;
}

/** "Mon – Sat 10:00 – 19:00" joined with `separator`, using abbreviated days. */
export function formatHoursSummary(separator: string): string {
  return SITE.hours.map((hours) => formatHours(hours, true)).join(separator);
}

/** "Closed Christmas Day, Boxing Day and New Year’s Day" */
export function formatClosedDays(): string {
  const days = SITE.closedDays;
  const head = days.slice(0, -1).join(", ");
  const list = days.length > 1 ? `${head} and ${days[days.length - 1]}` : days.join("");
  return `Closed ${list}`;
}

/** Address as two display lines: ["15 Coombe Road", "New Malden KT3 4QG"]. */
export function formatAddressLines(): readonly [string, string] {
  const { street, town, postcode } = SITE.address;
  return [street, `${town} ${postcode}`];
}

/** "15 Coombe Road, New Malden KT3 4QG" */
export function formatAddress(): string {
  return formatAddressLines().join(", ");
}

/** "15 Coombe Road, New Malden" (no postcode) */
export function formatAddressShort(): string {
  const { street, town } = SITE.address;
  return `${street}, ${town}`;
}

/** "WhatsApp 07789 096148" */
export function formatWhatsAppLine(): string {
  return `WhatsApp ${SITE.phoneDisplay}`;
}

/** "4.9 on Google · 200 reviews" */
export function formatRatingLine(): string {
  const { score, reviews } = SITE.googleRating;
  return `${score} on Google · ${reviews} reviews`;
}

/** "· 200 Google reviews" */
export function formatGoogleReviews(): string {
  return `· ${SITE.googleRating.reviews} Google reviews`;
}

/** "© 2026 Rave’s Parlor London" (the year is data, never read from the clock) */
export function formatCopyright(): string {
  return `© ${SITE.copyrightStartYear} ${SITE.brandName}`;
}

/** "£30" */
export function formatPrice(amount: number): string {
  return `£${amount}`;
}

/** "3 services" */
export function formatServiceCount(count: number): string {
  return `${count} services`;
}
