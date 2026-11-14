import Image from "next/image";
import { Editable } from "@/components/edit/Editable";
import type { ResolvedImage } from "@/lib/content/view";
import type { CategoryKey } from "@/lib/data/services";
import styles from "./DialogMedia.module.css";

interface DialogMediaProps {
  category: CategoryKey;
  images: readonly ResolvedImage[];
}

/** A category's two dialog photos (content slots dialog.<category>.0 and .1). */
const PHOTOS = [0, 1] as const;

/** The photos beside the details (phones show only the first). */
export function DialogMedia({ category, images }: DialogMediaProps) {
  return (
    <div className={styles.media}>
      {PHOTOS.map((index) => {
        const image = images.at(index);
        if (!image) return null;
        return (
          <Editable key={index} target={{ kind: "image", slot: `dialog.${category}.${index}` }}>
            <Image
              src={image.src}
              alt=""
              width={800}
              height={500}
              sizes="(max-width: 820px) 100vw, 520px"
            />
          </Editable>
        );
      })}
    </div>
  );
}
