import { MenuHead } from "./MenuHead";
import { ServiceGrid } from "./ServiceGrid";
import styles from "./ServiceMenu.module.css";
import { ServiceTabs } from "./ServiceTabs";

/** The service menu section: category tabs, the active category's title and intro, and its cards. */
export function ServiceMenu() {
  return (
    <section
      className={styles.menu}
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
