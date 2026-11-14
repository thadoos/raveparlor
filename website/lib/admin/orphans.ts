import type { SiteContent } from "@/lib/content/schema";

/**
 * Storage paths that no given content references. Paths starting with "/" are bundled files,
 * not storage objects, so they never protect anything. Pure: the caller lists and removes.
 */
export function findOrphans(storagePaths: string[], referenced: SiteContent[]): string[] {
  const used = new Set<string>();
  for (const content of referenced) {
    for (const ref of Object.values(content.images)) {
      if (!ref.path.startsWith("/")) used.add(ref.path);
    }
  }
  return storagePaths.filter((path) => !used.has(path));
}
