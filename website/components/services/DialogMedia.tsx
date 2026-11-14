import Image from "next/image";
import type { ResolvedImage } from "@/lib/content/view";
import styles from "./DialogMedia.module.css";

interface DialogMediaProps {
  /** The service's 1-2 photos. */
  photos: readonly ResolvedImage[];
}

/** The photos beside the details (phones show only the first). */
export function DialogMedia({ photos }: DialogMediaProps) {
  return (
    <div className={styles.media}>
      {photos.slice(0, 2).map((photo, index) => (
        <Image
          key={index}
          src={photo.src}
          alt=""
          width={800}
          height={500}
          sizes="(max-width: 820px) 100vw, 520px"
        />
      ))}
    </div>
  );
}
