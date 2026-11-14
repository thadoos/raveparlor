import Image from "next/image";
import { Editable } from "@/components/edit/Editable";
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

/** The photos beside the details (phones show only the first). Each is an edit target. */
export function DialogMedia({ category, item, photos }: DialogMediaProps) {
  return (
    <div className={styles.media}>
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
