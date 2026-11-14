import Image from "next/image";
import type { ResolvedImage } from "@/lib/content/view";
import styles from "./DialogMedia.module.css";

interface DialogMediaProps {
  images: readonly ResolvedImage[];
}

/** The photos beside the details (phones show only the first). */
export function DialogMedia({ images }: DialogMediaProps) {
  return (
    <div className={styles.media}>
      {images.map((image, index) => (
        <Image
          key={index}
          src={image.src}
          alt=""
          width={800}
          height={500}
          sizes="(max-width: 820px) 100vw, 520px"
        />
      ))}
    </div>
  );
}
