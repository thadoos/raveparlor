import type { SiteContent } from "@/lib/content/schema";

/** A storage object as the cleanup sees it. `createdAt` is the ISO timestamp Storage reports. */
export interface StorageObject {
  path: string;
  createdAt: string;
}

/** Objects younger than this are never orphans: an upload lands in storage before the draft that
 *  uses it is saved, so a fresh object may simply not be referenced yet. Next cleanup gets it. */
export const MIN_ORPHAN_AGE_MS = 60 * 60 * 1000;

interface FindOrphansOptions {
  now: Date;
  minAgeMs?: number;
}

/**
 * Paths of storage objects that no given content references and that are old enough to remove.
 * Paths starting with "/" are bundled files, not storage objects, so they never protect anything.
 * Objects with an unreadable age are kept. Pure: the caller lists and removes.
 */
export function findOrphans(
  objects: StorageObject[],
  referenced: SiteContent[],
  { now, minAgeMs = MIN_ORPHAN_AGE_MS }: FindOrphansOptions,
): string[] {
  const used = new Set<string>();
  for (const content of referenced) {
    for (const ref of Object.values(content.images)) {
      if (!ref.path.startsWith("/")) used.add(ref.path);
    }
  }
  const cutoff = now.getTime() - minAgeMs;
  return objects
    .filter(({ path, createdAt }) => {
      if (used.has(path)) return false;
      const created = Date.parse(createdAt);
      return !Number.isNaN(created) && created <= cutoff;
    })
    .map(({ path }) => path);
}
