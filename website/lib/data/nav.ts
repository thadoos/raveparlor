/** In-page navigation shared by the menu overlay and the footer. */

export interface NavLink {
  href: string;
  label: string;
}

const HOME: NavLink = { href: "#top", label: "Home" };
const GALLERY: NavLink = { href: "#gallery", label: "Gallery" };
const PARLOR: NavLink = { href: "#parlor", label: "The Parlor" };
const SERVICES: NavLink = { href: "#services", label: "Services" };
const PRICES: NavLink = { href: "#prices", label: "Price List" };

/** Links in the full-screen menu. */
export const MENU_LINKS: readonly NavLink[] = [
  HOME,
  GALLERY,
  PARLOR,
  SERVICES,
  PRICES,
  { href: "#book", label: "Book & Visit" },
];

/** Links in the footer (the booking link is labelled "Book" here). */
export const FOOTER_LINKS: readonly NavLink[] = [
  GALLERY,
  SERVICES,
  PRICES,
  { href: "#book", label: "Book" },
];
