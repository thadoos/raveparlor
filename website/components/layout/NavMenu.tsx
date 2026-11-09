import { BOOK_MESSAGE, whatsappLink } from "@/lib/contact";

export function NavMenu() {
  return (
    <div className="menu" id="menu" aria-hidden="true">
      <nav aria-label="Page sections">
        <a href="#top">Home</a>
        <a href="#gallery">Gallery</a>
        <a href="#parlor">The Parlor</a>
        <a href="#services">Services</a>
        <a href="#prices">Price List</a>
        <a href="#book">Book &amp; Visit</a>
      </nav>
      <div className="menu-foot">
        <a href="https://www.instagram.com/ravesparlor_london">Instagram</a>
        <a href={whatsappLink(BOOK_MESSAGE)}>WhatsApp</a>
      </div>
    </div>
  );
}
