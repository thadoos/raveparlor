import { BOOK_MESSAGE, whatsappLink } from "@/lib/contact";
import { MENU_LINKS } from "@/lib/data/nav";
import { SITE } from "@/lib/data/site";

export function NavMenu() {
  return (
    <div className="menu" id="menu" aria-hidden="true">
      <nav aria-label="Page sections">
        {MENU_LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <div className="menu-foot">
        <a href={SITE.instagramUrl}>Instagram</a>
        <a href={whatsappLink(BOOK_MESSAGE)}>WhatsApp</a>
      </div>
    </div>
  );
}
