import { DEFAULT_CONTENT_V1, migrateV1toV2 } from "@/lib/content/legacy-v1";
import type { SiteContent } from "@/lib/content/schema";

/** Today's site content, used to seed the database and as the fallback when it is unavailable. */
export const DEFAULT_CONTENT: SiteContent = migrateV1toV2(DEFAULT_CONTENT_V1);
