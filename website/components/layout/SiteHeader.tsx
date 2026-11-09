"use client";

import { useRef } from "react";
import { useNavMenu } from "./MenuProvider";
import { useHeaderTone } from "./use-header-tone";

export function SiteHeader() {
  const { open, toggle, close, burgerRef } = useNavMenu();
  const headRef = useRef<HTMLElement>(null);
  const tone = useHeaderTone(headRef, open);
  const className = ["head", tone.dark && "is-dark", tone.blur && "is-blur"]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={className} id="head" ref={headRef}>
      <button
        className="burger"
        id="burger"
        type="button"
        ref={burgerRef}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="menu"
        onClick={(e) => toggle(e.detail === 0)}
      >
        <span className="burger-lines" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <i className="ring ring-l"></i>
          <i className="ring ring-r"></i>
        </span>
      </button>
      <a
        className="logo"
        href="#top"
        aria-label="Rave’s Parlor London, back to top"
        onClick={close}
      >
        <span className="logo-mark" aria-hidden="true"></span>
      </a>
      <a className="book" href="#book" onClick={close}>
        Book
      </a>
    </header>
  );
}
