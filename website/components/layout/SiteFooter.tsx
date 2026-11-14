import { Editable } from "@/components/edit/Editable";
import { BOOK_MESSAGE, whatsappLink } from "@/lib/contact";
import { FOOTER_LINKS } from "@/lib/data/nav";
import type { SiteInfo } from "@/lib/data/site";
import { formatAddress, formatCopyright, formatWhatsAppLine } from "@/lib/format";
import styles from "./SiteFooter.module.css";

interface SiteFooterProps {
  site: SiteInfo;
}

export function SiteFooter({ site }: SiteFooterProps) {
  return (
    <footer className={styles.foot} data-tone="light">
      <nav aria-label="Footer">
        {FOOTER_LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
        <a href={site.instagramUrl}>Instagram</a>
        <a
          href={whatsappLink(site.whatsappNumber, BOOK_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
      </nav>
      {/* The whole line, not just the number, so the public markup stays a single text node */}
      <Editable target={{ kind: "business" }}>
        <p>{`${formatAddress(site)} · ${formatWhatsAppLine(site)}`}</p>
      </Editable>
      <p>{formatCopyright(site)}</p>
    </footer>
  );
}
