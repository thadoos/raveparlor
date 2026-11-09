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
        <p className="eyebrow reveal">Rave’s Parlor London</p>
        <h2 className="title reveal" id="prices-title">
          Price List
        </h2>

        <div className="reveal">
          <PricePoster />
        </div>
      </div>
    </section>
  );
}
