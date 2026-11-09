import { Fragment } from "react";

const BARBERS = [
  { name: "Rave", days: "Mon, Thu, Fri, Sat & Sun", cut: ["£55", "£80", "£35"] },
  { name: "John", days: "Tue, Wed, Thu, Fri & occasional Sat", cut: ["£45", "£60", "£30"] },
  { name: "Julian", days: "Thu, Fri, Sat & Sun", cut: ["£40", "£65", "£30"] },
];

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
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="group-note">All haircut services include wash and finishing.</p>
          {BARBERS.map((b) => (
            <Fragment key={b.name}>
              <div className="row head-row barber-head">
                <h4>
                  {b.name}
                  <small>Available: {b.days}</small>
                </h4>
                <span>Gentleman</span>
                <span>Ladies</span>
                <span>Under 12s</span>
              </div>
              <div className="row">
                <div>Cutting &amp; Finishing</div>
                <span>{b.cut[0]}</span>
                <span>{b.cut[1]}</span>
                <span>{b.cut[2]}</span>
              </div>
              <div className="row">
                <div>Cleansing &amp; Styling</div>
                <span>–</span>
                <span>£30 – £40</span>
                <span>–</span>
              </div>
              <div className="row">
                <div>Up-do Hairdressing</div>
                <span>–</span>
                <span>£30 – £80</span>
                <span>–</span>
              </div>
            </Fragment>
          ))}
        </div>

        <div className="group reveal" id="price-colour">
          <div className="row head-row">
            <h3>Colour / Highlight</h3>
            <span>Short</span>
            <span>Medium</span>
            <span>Long</span>
          </div>
          <div className="row">
            <div>Root Retouching</div>
            <span>£80</span>
            <span>–</span>
            <span>–</span>
          </div>
          <div className="row">
            <div>Full Head Colour</div>
            <span>£80</span>
            <span>£100</span>
            <span>£120</span>
          </div>
          <div className="row">
            <div>Half Head Highlights</div>
            <span>£100</span>
            <span>£110</span>
            <span>£130</span>
          </div>
          <div className="row">
            <div>Full Head Highlights</div>
            <span>£100</span>
            <span>£120</span>
            <span>£150</span>
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
            <div>
              Olaplex Professional No.1 Pre Chemical Services &amp; No.2 Professional Rinsing Hair
            </div>
            <span className="span">£30</span>
          </div>
          <div className="row">
            <div>Kérastase Scalp Relax Spa And Serum</div>
            <span className="span">£15</span>
          </div>
        </div>

        <p className="note reveal">
          All chemical services exclude haircut, wash and finishing.
          <br />
          所有電髮、染髮服務不包括剪髮和洗吹造型
        </p>
      </div>
    </section>
  );
}
