import Image from "next/image";

export function ServicesOverview() {
  return (
    <section
      className="slide scroll services"
      id="services"
      data-tone="light"
      data-blur
      aria-labelledby="services-title"
    >
      <h2 className="svc-title reveal" id="services-title">
        <span>Our</span>
        <span className="svc-tag">
          <span className="svc-tag-in">14 services</span>
        </span>
        <span>Services</span>
      </h2>
      <div className="svc-grid">
        <a className="svc-card reveal" href="#service-menu" data-cat="cut">
          <span className="svc-media">
            <span className="svc-go" aria-hidden="true">
              View →
            </span>
            <Image
              src="/images/portrait-colour.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              style={{ objectPosition: "50% 30%" }}
            />
          </span>
          <span className="svc-info">
            <span className="svc-name">Cut &amp; Style</span>
            <span className="svc-count">
              3 services<span className="svc-from"> · from £30</span>
            </span>
            <svg className="svc-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="18" r="3"></circle>
              <path d="M8.2 15.9 19 3M15.8 15.9 5 3"></path>
            </svg>
          </span>
        </a>
        <a className="svc-card reveal" href="#service-menu" data-cat="colour">
          <span className="svc-media">
            <span className="svc-go" aria-hidden="true">
              View →
            </span>
            <Image
              src="/images/bob-copper.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              style={{ objectPosition: "50% 50%" }}
            />
          </span>
          <span className="svc-info">
            <span className="svc-name">Colour &amp; Highlights</span>
            <span className="svc-count">
              6 services<span className="svc-from"> · from £70</span>
            </span>
            <svg className="svc-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3c3.5 4.6 6 8 6 11a6 6 0 0 1-12 0c0-3 2.5-6.4 6-11z"></path>
            </svg>
          </span>
        </a>
        <a className="svc-card reveal" href="#service-menu" data-cat="perm">
          <span className="svc-media">
            <span className="svc-go" aria-hidden="true">
              View →
            </span>
            <Image
              src="/images/portrait-mono.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              style={{ objectPosition: "50% 40%" }}
            />
          </span>
          <span className="svc-info">
            <span className="svc-name">Perm &amp; Straightening</span>
            <span className="svc-count">
              3 services<span className="svc-from"> · from £90</span>
            </span>
            <svg className="svc-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 7c3-3 6 3 9 0s6 3 9 0M3 12c3-3 6 3 9 0s6 3 9 0M3 17c3-3 6 3 9 0s6 3 9 0"></path>
            </svg>
          </span>
        </a>
        <a className="svc-card reveal" href="#service-menu" data-cat="treat">
          <span className="svc-media">
            <span className="svc-go" aria-hidden="true">
              View →
            </span>
            <Image
              src="/images/parlor-reception.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              style={{ objectPosition: "40% 50%" }}
            />
          </span>
          <span className="svc-info">
            <span className="svc-name">Treatments</span>
            <span className="svc-count">
              2 services<span className="svc-from"> · from £15</span>
            </span>
            <svg className="svc-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M12 8.5 13.2 10.8 15.5 12 13.2 13.2 12 15.5 10.8 13.2 8.5 12 10.8 10.8z"></path>
            </svg>
          </span>
        </a>
      </div>
    </section>
  );
}
