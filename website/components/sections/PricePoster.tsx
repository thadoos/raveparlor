"use client";

import Image from "next/image";
import { useRef, useState, type MouseEvent, type TouchEvent } from "react";
import { useModalLock } from "@/lib/hooks/use-modal-lock";

const PARTS = ["Hair Cut / Blow-dry", "Colour, Perm & Treatments"] as const;
const SWIPE_MIN_PX = 40;
const ALT =
  "Rave’s Parlor London price list: hair cut and blow-dry prices for Rave, John and Julian, colour and highlights, perm, and hair treatments. All chemical services exclude haircut, wash and finishing.";

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The price list poster. Clicking it opens a full-screen viewer (never navigates away): the whole
 * poster on wide screens, and on phones one half at a time with arrows and swipe to slide between
 * the halves. Close with the X button, Esc, or by clicking the dark area. The link href stays as a
 * no-JS fallback. Styles: `.price-poster` and `.pv-*` in globals.css.
 */
export function PricePoster() {
  const dialog = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const [part, setPart] = useState<0 | 1>(0);
  const [viewing, setViewing] = useState(false);

  // The deck stands down (no slide wheel/touch/key handling) while the viewer is open.
  useModalLock(viewing);

  function open(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    setPart(0);
    setViewing(true);
    dialog.current?.showModal();
  }

  function onTouchStart(e: TouchEvent<HTMLDivElement>) {
    touchX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: TouchEvent<HTMLDivElement>) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) >= SWIPE_MIN_PX) setPart(dx < 0 ? 1 : 0);
  }

  return (
    <>
      <a
        className="price-poster"
        href="/images/price-list.webp"
        target="_blank"
        rel="noopener"
        aria-label="View the full price list"
        onClick={open}
      >
        <Image
          src="/images/price-list.webp"
          alt={ALT}
          width={1491}
          height={1055}
          sizes="(max-width: 1328px) 100vw, 1280px"
        />
      </a>
      <p className="poster-hint">Tap the price list to enlarge</p>

      <dialog
        ref={dialog}
        className="pv"
        data-part={part}
        aria-label="Price list"
        onClose={() => setViewing(false)}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t === e.currentTarget || t.classList.contains("pv-stage")) dialog.current?.close();
        }}
      >
        <button
          type="button"
          className="pv-close"
          aria-label="Close price list"
          onClick={() => dialog.current?.close()}
        >
          <Icon path="M6 6l12 12M18 6 6 18" />
        </button>

        <div className="pv-stage">
          <div className="pv-view" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="pv-track">
              <Image
                src="/images/price-list.webp"
                alt={ALT}
                width={1491}
                height={1055}
                sizes="(max-width: 820px) 180vw, 1500px"
              />
            </div>
          </div>
        </div>

        <div className="pv-nav">
          <button
            type="button"
            className="pv-btn"
            onClick={() => setPart(0)}
            disabled={part === 0}
            aria-label="Show hair cut prices"
          >
            <Icon path="M15 5 8 12l7 7" />
          </button>
          <p className="pv-label" aria-live="polite">
            {PARTS[part]}
            <span>{part + 1} / 2</span>
          </p>
          <button
            type="button"
            className="pv-btn"
            onClick={() => setPart(1)}
            disabled={part === 1}
            aria-label="Show colour, perm and treatment prices"
          >
            <Icon path="m9 5 7 7-7 7" />
          </button>
        </div>
      </dialog>
    </>
  );
}
