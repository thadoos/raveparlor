"use client";

import { useRef } from "react";
import { cx } from "@/lib/cx";
import { useNavMenu } from "./MenuProvider";
import styles from "./SiteHeader.module.css";
import { useHeaderTone } from "./use-header-tone";

export function SiteHeader() {
  const { open, toggle, close, burgerRef } = useNavMenu();
  const headRef = useRef<HTMLElement>(null);
  const tone = useHeaderTone(headRef, open);
  const className = cx(
    styles.head,
    tone.dark && styles.isDark,
    tone.blur && styles.isBlur,
    open && styles.isOpen,
  );

  return (
    <header className={className} id="head" ref={headRef}>
      <button
        className={styles.burger}
        id="burger"
        type="button"
        ref={burgerRef}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="menu"
        onClick={(e) => toggle(e.detail === 0)}
      >
        <span className={styles.burgerLines} aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <i className={cx(styles.ring, styles.ringL)}></i>
          <i className={cx(styles.ring, styles.ringR)}></i>
        </span>
      </button>
      <a
        className={styles.logo}
        href="#top"
        aria-label="Rave’s Parlor London, back to top"
        onClick={close}
      >
        <span className="logo-mark" aria-hidden="true"></span>
      </a>
      <a className={styles.book} href="#book" onClick={close}>
        Book
      </a>
    </header>
  );
}
