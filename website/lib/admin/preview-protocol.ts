import { parseTargetKey } from "@/lib/admin/targets";
import { parseSiteContent } from "@/lib/content/schema";
import type { SiteContent } from "@/lib/content/schema";

/**
 * Messages between the admin (visual mode) and the /preview iframe. Both sides check the origin
 * and parse every message; anything else is ignored.
 */

/** Admin to preview: the content to render. */
export type ToPreview = { type: "draft"; content: SiteContent };

/** Preview to admin: it is listening, or the admin clicked an editable region (a targetKey). */
export type FromPreview = { type: "ready" } | { type: "edit"; target: string };

function typeOf(data: unknown): unknown {
  return data !== null && typeof data === "object" && "type" in data ? data.type : undefined;
}

export function parseToPreview(data: unknown): ToPreview | null {
  if (typeOf(data) !== "draft" || data === null || typeof data !== "object") return null;
  if (!("content" in data)) return null;
  const result = parseSiteContent(data.content);
  return result.ok ? { type: "draft", content: result.content } : null;
}

export function parseFromPreview(data: unknown): FromPreview | null {
  const type = typeOf(data);
  if (type === "ready") return { type };
  if (type !== "edit" || data === null || typeof data !== "object" || !("target" in data)) {
    return null;
  }
  const { target } = data;
  if (typeof target !== "string" || parseTargetKey(target) === null) return null;
  return { type, target };
}

/** The parsed message, or null when it came from another origin or doesn't parse. */
export function acceptMessage<T>(
  origin: string,
  expected: string,
  data: unknown,
  parse: (data: unknown) => T | null,
): T | null {
  return origin === expected ? parse(data) : null;
}
