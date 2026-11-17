import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { parseSiteContent } from "@/lib/content/schema";
import type { SiteContent } from "@/lib/content/schema";
import { buildSiteView } from "@/lib/content/view";
import type { SiteView } from "@/lib/content/view";
import { createPublicClient } from "@/lib/supabase/public";

/** Cache tag on the published content; revalidate it after publishing. */
export const CONTENT_TAG = "site-content";

/** Validates a `site_content` row. Throws rather than falling back, so bad content never ships silently. */
export function parsePublishedRow(row: unknown): SiteContent {
  if (row === null || typeof row !== "object" || !("content" in row)) {
    throw new Error("No published content");
  }
  const result = parseSiteContent(row.content);
  if (!result.ok) throw new Error(`Invalid published content:\n${result.issues.join("\n")}`);
  return result.content;
}

export async function getPublishedContent(): Promise<SiteContent> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_TAG);

  const { data, error } = await createPublicClient()
    .from("site_content")
    .select("content")
    .eq("id", "published")
    .maybeSingle();
  if (error) throw new Error(`Failed to load published content: ${error.message}`);
  return parsePublishedRow(data);
}

/** When the published content was last saved, or null when unknown (never throws). */
export async function getPublishedUpdatedAt(): Promise<Date | null> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_TAG);

  const { data, error } = await createPublicClient()
    .from("site_content")
    .select("updated_at")
    .eq("id", "published")
    .maybeSingle();
  if (error || !data?.updated_at) return null;
  const date = new Date(data.updated_at);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getSiteView(): Promise<SiteView> {
  return buildSiteView(await getPublishedContent(), process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
}
