import { serializeJsonLd } from "@/lib/seo";

interface JsonLdProps {
  data: object;
}

/** Renders structured data as an inline `application/ld+json` script. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
