import Image from "next/image";
import { Editable } from "@/components/edit/Editable";
import { cx } from "@/lib/cx";
import type { CategoryKey } from "@/lib/content/schema";
import type { ResolvedImage } from "@/lib/content/view";
import styles from "./DialogMedia.module.css";

interface DialogMediaProps {
  category: CategoryKey;
  /** The service's key within its category. */
  item: string;
  /** The service's 1-2 photos. */
  photos: readonly ResolvedImage[];
}

/**
 * The photos beside the details (phones show only the first). A lone photo is taller so it fills
 * the column like a pair does. Each is an edit target.
 */
export function DialogMedia({ category, item, photos }: DialogMediaProps) {
  return (
    <div className={cx(styles.media, photos.length === 1 && styles.single)}>
      {photos.slice(0, 2).map((photo, i) => (
        <Editable key={i} target={{ kind: "itemPhoto", category, item, index: i === 0 ? 0 : 1 }}>
          <Image
            src={photo.src}
            alt={photo.alt}
            width={800}
            height={500}
            sizes="(max-width: 820px) 100vw, 520px"
          />
        </Editable>
      ))}
    </div>
  );
}
