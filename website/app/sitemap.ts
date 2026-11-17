import type { MetadataRoute } from "next";
import { getPublishedUpdatedAt } from "@/lib/content/published";
import { SITE_URL } from "@/lib/data/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = await getPublishedUpdatedAt();
  return [
    {
      url: SITE_URL,
      ...(lastModified && { lastModified }),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
