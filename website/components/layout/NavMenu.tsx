"use client";

import { useSiteView } from "@/components/site/site-view-context";
import { BOOK_MESSAGE, whatsappLink } from "@/lib/contact";
import { cx } from "@/lib/cx";
import { MENU_LINKS } from "@/lib/data/nav";
import { useNavMenu } from "./MenuProvider";
import styles from "./NavMenu.module.css";

export function NavMenu() {
  const { open, close, menuRef } = useNavMenu();
  const { site } = useSiteView();

  return (
    <div
      className={cx(styles.menu, open && styles.open)}
      id="menu"
      ref={menuRef}
      aria-hidden={!open}
      inert={!open}
    >
      <nav aria-label="Page sections">
        {MENU_LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={close}>
            {link.label}
          </a>
        ))}
      </nav>
      <div className={styles.foot}>
        <a href={site.instagramUrl} onClick={close}>
          Instagram
        </a>
        <a
          href={whatsappLink(site.whatsappNumber, BOOK_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={close}
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
