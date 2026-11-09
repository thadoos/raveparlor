import { Reveal } from "@/components/ui/Reveal";
import { cx } from "@/lib/cx";
import styles from "./PriceList.module.css";
import { PricePoster } from "./PricePoster";

export function PriceList() {
  return (
    <section
      className={styles.prices}
      id="prices"
      data-tone="light"
      data-blur
      aria-labelledby="prices-title"
    >
      <div className={cx(styles.wrap, styles.wide)}>
        <Reveal as="p" className={styles.eyebrow}>
          Rave’s Parlor London
        </Reveal>
        <Reveal as="h2" className={styles.title} id="prices-title">
          Price List
        </Reveal>

        <Reveal>
          <PricePoster />
        </Reveal>
      </div>
    </section>
  );
}
