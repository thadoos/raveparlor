import type { OpeningHours, SiteInfo } from "@/lib/data/site";

/** "Mon – Sat 10:00 – 19:00" (set `short` to use the abbreviated day label, e.g. "Sun"). */
export function formatHours(hours: OpeningHours, short = false): string {
  return `${short ? hours.shortDays : hours.days} ${hours.open} – ${hours.close}`;
}

/** "Last appointment 18:00" */
export function formatLastAppointment(hours: OpeningHours): string {
  return `Last appointment ${hours.lastAppointment}`;
}

/** "Mon – Sat 10:00 – 19:00" joined with `separator`, using abbreviated days. */
export function formatHoursSummary(site: SiteInfo, separator: string): string {
  return site.hours.map((hours) => formatHours(hours, true)).join(separator);
}

/** "Closed Christmas Day, Boxing Day and New Year’s Day" */
export function formatClosedDays(site: SiteInfo): string {
  const days = site.closedDays;
  const head = days.slice(0, -1).join(", ");
  const list = days.length > 1 ? `${head} and ${days[days.length - 1]}` : days.join("");
  return `Closed ${list}`;
}

/** Address as two display lines: ["15 Coombe Road", "New Malden KT3 4QG"]. */
export function formatAddressLines(site: SiteInfo): readonly [string, string] {
  const { street, town, postcode } = site.address;
  return [street, `${town} ${postcode}`];
}

/** "15 Coombe Road, New Malden KT3 4QG" */
export function formatAddress(site: SiteInfo): string {
  return formatAddressLines(site).join(", ");
}

/** "15 Coombe Road, New Malden" (no postcode) */
export function formatAddressShort(site: SiteInfo): string {
  const { street, town } = site.address;
  return `${street}, ${town}`;
}

/** "WhatsApp 07789 096148" */
export function formatWhatsAppLine(site: SiteInfo): string {
  return `WhatsApp ${site.phoneDisplay}`;
}

/** "4.9 on Google · 202 reviews" */
export function formatRatingLine(site: SiteInfo): string {
  const { score, reviews } = site.googleRating;
  return `${score} on Google · ${reviews} reviews`;
}

/** "· 202 Google reviews" */
export function formatGoogleReviews(site: SiteInfo): string {
  return `· ${site.googleRating.reviews} Google reviews`;
}

/** "© 2026 Rave’s Parlor London" (the year is data, never read from the clock) */
export function formatCopyright(site: SiteInfo): string {
  return `© ${site.copyrightStartYear} ${site.brandName}`;
}

/** "£30" */
export function formatPrice(amount: number): string {
  return `£${amount}`;
}

/** "3 services" */
export function formatServiceCount(count: number): string {
  return `${count} services`;
}
