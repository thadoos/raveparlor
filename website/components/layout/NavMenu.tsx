"use client";

import { BOOK_MESSAGE, whatsappLink } from "@/lib/contact";
import { MENU_LINKS } from "@/lib/data/nav";
import { SITE } from "@/lib/data/site";
import { useNavMenu } from "./MenuProvider";

export function NavMenu() {
  const { open, close, menuRef } = useNavMenu();

  return (
    <div className="menu" id="menu" ref={menuRef} aria-hidden={!open} inert={!open}>
      <nav aria-label="Page sections">
        {MENU_LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={close}>
            {link.label}
          </a>
        ))}
      </nav>
      <div className="menu-foot">
        <a href={SITE.instagramUrl} onClick={close}>
          Instagram
        </a>
        <a href={whatsappLink(BOOK_MESSAGE)} onClick={close}>
          WhatsApp
        </a>
      </div>
    </div>
  );
}
