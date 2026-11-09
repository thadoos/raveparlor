import type { MenuItem } from "@/lib/data/services";

interface DialogDetailsProps {
  item: MenuItem;
  /** True while the booking step is shown: the details collapse and become inert. */
  flipped: boolean;
}

/** Description, "Ideal for" and "Good to know". Collapses when the booking step starts. */
export function DialogDetails({ item, flipped }: DialogDetailsProps) {
  return (
    <div className="md-flip" id="md-flip" data-flipped={flipped ? "" : undefined}>
      <div className="md-front" id="md-front" inert={flipped} aria-hidden={flipped}>
        <div className="md-collapse">
          <p className="md-desc" id="md-desc">
            {item.desc}
          </p>
          {item.ideal && (
            <div className="md-block" id="md-ideal-wrap">
              <h4>Ideal for</h4>
              <p id="md-ideal">{item.ideal}</p>
            </div>
          )}
          {item.note && (
            <div className="md-block" id="md-note-wrap">
              <h4>Good to know</h4>
              <p id="md-note">{item.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
