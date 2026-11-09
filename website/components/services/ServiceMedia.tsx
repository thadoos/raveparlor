import Image from "next/image";
import { cx } from "@/lib/cx";
import { positionClass } from "@/lib/data/images";
import styles from "./ServiceGrid.module.css";

interface ServiceMediaProps {
  src: string;
  /** CSS `object-position` of the photo, e.g. "50% 30%". */
  position: string;
  /** Portrait photo beside the cards (categories with two or more services). */
  tall: boolean;
  animate: boolean;
}

/** The photo beside a category's cards. */
export function ServiceMedia({ src, position, tall, animate }: ServiceMediaProps) {
  return (
    <div className={cx(styles.media, tall && styles.tall, animate && styles.enter)}>
      <Image
        src={src}
        alt=""
        fill
        sizes="(max-width: 820px) 100vw, 50vw"
        className={positionClass(position)}
      />
    </div>
  );
}
