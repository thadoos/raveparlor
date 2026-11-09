import { BOOK_MESSAGE, whatsappLink } from "@/lib/contact";

export function SiteFooter() {
  return (
    <footer className="foot" data-tone="light">
      <nav aria-label="Footer">
        <a href="#gallery">Gallery</a>
        <a href="#services">Services</a>
        <a href="#prices">Price List</a>
        <a href="#book">Book</a>
        <a href="https://www.instagram.com/ravesparlor_london">Instagram</a>
        <a href={whatsappLink(BOOK_MESSAGE)}>WhatsApp</a>
      </nav>
      <p>15 Coombe Road, New Malden KT3 4QG · WhatsApp 07789 096148</p>
      <p>© 2026 Rave’s Parlor London</p>
    </footer>
  );
}
