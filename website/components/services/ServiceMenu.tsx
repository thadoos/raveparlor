import { MenuHead } from "./MenuHead";
import { ServiceGrid } from "./ServiceGrid";
import { ServiceTabs } from "./ServiceTabs";

/** The service menu section: category tabs, the active category's title and intro, and its cards. */
export function ServiceMenu() {
  return (
    <section
      className="mn"
      id="service-menu"
      data-tone="light"
      data-blur
      aria-labelledby="mn-title"
    >
      <ServiceTabs />
      <MenuHead />
      <ServiceGrid />
    </section>
  );
}
