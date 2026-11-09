import Image from "next/image";

interface DialogMediaProps {
  images: readonly string[];
}

/** The photos beside the details (phones show only the first). */
export function DialogMedia({ images }: DialogMediaProps) {
  return (
    <div className="md-media">
      {images.map((src) => (
        <Image
          key={src}
          src={src}
          alt=""
          width={800}
          height={500}
          sizes="(max-width: 820px) 100vw, 520px"
        />
      ))}
    </div>
  );
}
