import { Reveal } from "@/components/ui/Reveal";
import { PricePoster } from "./PricePoster";

export function PriceList() {
  return (
    <section
      className="prices"
      id="prices"
      data-tone="light"
      data-blur
      aria-labelledby="prices-title"
    >
      <div className="wrap wide">
        <Reveal as="p" className="eyebrow">
          Rave’s Parlor London
        </Reveal>
        <Reveal as="h2" className="title" id="prices-title">
          Price List
        </Reveal>

        <Reveal>
          <PricePoster />
        </Reveal>
      </div>
    </section>
  );
}
