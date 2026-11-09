import Image from "next/image";

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

        <a
          className="price-poster reveal"
          href="/images/price-list.webp"
          target="_blank"
          rel="noopener"
          aria-label="Open the full price list image in a new tab"
        >
          <Image
            src="/images/price-list.webp"
            alt="Rave’s Parlor London price list: hair cut and blow-dry prices for Rave, John and Julian, colour and highlights, perm, and hair treatments. All chemical services exclude haircut, wash and finishing."
            width={1491}
            height={1055}
            sizes="(max-width: 1328px) 100vw, 1280px"
          />
        </a>
        <p className="poster-hint reveal">Tap the price list to enlarge</p>
      </div>
    </section>
  );
}
