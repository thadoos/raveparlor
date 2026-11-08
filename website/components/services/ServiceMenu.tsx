export function ServiceMenu() {
  return (
    <section
      className="mn"
      id="service-menu"
      data-tone="light"
      data-blur
      aria-labelledby="mn-title"
    >
      <div className="mn-tabs" role="tablist" aria-label="Service categories">
        <button className="mn-tab" role="tab" type="button" data-cat="cut">
          Cut &amp; Style
        </button>
        <button className="mn-tab" role="tab" type="button" data-cat="colour">
          Colour &amp; Highlights
        </button>
        <button className="mn-tab" role="tab" type="button" data-cat="perm">
          Perm &amp; Straightening
        </button>
        <button className="mn-tab" role="tab" type="button" data-cat="treat">
          Treatments
        </button>
      </div>
      <div className="mn-head">
        <h2 className="mn-title" id="mn-title"></h2>
        <div className="mn-intro" id="mn-intro"></div>
      </div>
      <div className="mn-grid" id="mn-grid" role="tabpanel" aria-labelledby="mn-title"></div>
    </section>
  );
}
