export function PriceList() {
  return (
    <section
      className="prices"
      id="prices"
      data-tone="light"
      data-blur
      aria-labelledby="prices-title"
    >
      <div className="wrap">
        <p className="eyebrow reveal">Rave’s Parlor London</p>
        <h2 className="title reveal" id="prices-title">
          Price List
        </h2>

        <div className="group reveal" id="price-cut">
          <div className="row head-row">
            <h3>Hair Cut / Blow-dry</h3>
            <span>Men</span>
            <span>Ladies</span>
            <span>Under 12s</span>
          </div>
          <div className="row">
            <div>Cutting &amp; Finishing</div>
            <span>£35</span>
            <span>£55</span>
            <span>£20</span>
          </div>
          <div className="row">
            <div>Cleansing &amp; Styling</div>
            <span className="span">£30 – £40</span>
          </div>
          <div className="row">
            <div>Up-do Hairdressing</div>
            <span className="span">£30 – £80</span>
          </div>
        </div>

        <div className="group reveal" id="price-colour">
          <div className="row head-row">
            <h3>Colour / Highlight</h3>
            <span>Short</span>
            <span>Medium</span>
            <span>Long</span>
          </div>
          <div className="row">
            <div>Tinting Colour</div>
            <span>£80</span>
            <span>£100</span>
            <span>£120</span>
          </div>
          <div className="row">
            <div>Full Head Highlights</div>
            <span>£100</span>
            <span>£120</span>
            <span>£150</span>
          </div>
          <div className="row">
            <div>Half Head Highlights</div>
            <span>£100</span>
            <span>£110</span>
            <span>£130</span>
          </div>
          <div className="row">
            <div>Technical Highlight</div>
            <span className="span">£100 – £220+</span>
          </div>
          <div className="row">
            <div>Full Head Bleach</div>
            <span className="span">£70 – £100</span>
          </div>
        </div>

        <div className="group reveal" id="price-perm">
          <div className="row head-row">
            <h3>Perm</h3>
            <span>Short</span>
            <span>Medium</span>
            <span>Long</span>
          </div>
          <div className="row">
            <div>
              Technical Perm <small>(Cool Perm)</small>
            </div>
            <span>£100</span>
            <span>£120</span>
            <span>£150</span>
          </div>
          <div className="row">
            <div>Half-Head Perm on Top</div>
            <span>£90</span>
            <span>–</span>
            <span>–</span>
          </div>
          <div className="row">
            <div>Ion Straightening</div>
            <span>£120</span>
            <span>£170</span>
            <span>£200</span>
          </div>
        </div>

        <div className="group reveal" id="price-treat">
          <div className="row head-row">
            <h3>Hair Treatments</h3>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="row">
            <div>Olaplex No.1 Pre-Chemical &amp; No.2 Rinse</div>
            <span className="span">£30</span>
          </div>
        </div>

        <p className="note reveal">
          All chemical services exclude haircut and finishing.
          <br />
          所有電髮、染髮服務不包括剪髮和洗吹造型
        </p>
      </div>
    </section>
  );
}
