import type { MouseEventHandler, RefObject } from "react";

interface DialogActionsProps {
  href: string;
  /** True while the booking step is shown. */
  flipped: boolean;
  /** True when "Continue" would do nothing yet because nothing is picked. */
  blocked: boolean;
  bookRef: RefObject<HTMLAnchorElement | null>;
  onBook: MouseEventHandler<HTMLAnchorElement>;
  onBack: () => void;
}

/** The "Book now" / "Continue on WhatsApp" link and the Back button. */
export function DialogActions({
  href,
  flipped,
  blocked,
  bookRef,
  onBook,
  onBack,
}: DialogActionsProps) {
  return (
    <div className="md-actions">
      <a
        ref={bookRef}
        className="md-book"
        href={href}
        aria-disabled={blocked ? "true" : undefined}
        onClick={onBook}
      >
        {flipped ? "Continue on WhatsApp" : "Book now"}
      </a>
      <button className="md-back-btn" type="button" hidden={!flipped} onClick={onBack}>
        Back
      </button>
    </div>
  );
}
