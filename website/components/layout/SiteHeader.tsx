export function SiteHeader() {
  return (
    <header className="head" id="head">
      <button
        className="burger"
        id="burger"
        type="button"
        aria-label="Open menu"
        aria-expanded="false"
        aria-controls="menu"
      >
        <span className="burger-lines" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <i className="ring ring-l"></i>
          <i className="ring ring-r"></i>
        </span>
      </button>
      <a className="logo" href="#top" aria-label="Rave’s Parlor London, back to top">
        <span className="logo-word" aria-hidden="true">
          RAVE’S PARLOR
        </span>
        <span className="logo-city" aria-hidden="true">
          LONDON
        </span>
      </a>
      <a className="book" href="#book">
        Book
      </a>
    </header>
  );
}
