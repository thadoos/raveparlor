import Image from "next/image";
import { cx } from "@/lib/cx";
import type { ResolvedImage } from "@/lib/content/view";
import { positionClass } from "@/lib/data/images";
import styles from "./ServiceGrid.module.css";

interface ServiceMediaProps {
  /** The photo; its `position` is the CSS `object-position`, e.g. "50% 30%". */
  image: ResolvedImage;
  /** Portrait photo beside the cards (categories with two or more services). */
  tall: boolean;
  animate: boolean;
}

/** The photo beside a category's cards. */
export function ServiceMedia({ image, tall, animate }: ServiceMediaProps) {
  return (
    <div className={cx(styles.media, tall && styles.tall, animate && styles.enter)}>
      <Image
        src={image.src}
        alt=""
        fill
        sizes="(max-width: 820px) 100vw, 50vw"
        className={image.position && positionClass(image.position)}
      />
    </div>
  );
}
