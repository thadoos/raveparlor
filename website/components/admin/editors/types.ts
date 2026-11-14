import type { SiteContent } from "@/lib/content/schema";

/** What every editor gets: the current draft and a way to change it. Editors own no page layout,
 *  so form mode and visual mode can both place them. */
export interface EditorProps {
  draft: SiteContent;
  apply: (op: (c: SiteContent) => SiteContent) => void;
}
