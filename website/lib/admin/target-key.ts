import type { CategoryKey, ImageSlot } from "@/lib/content/schema";

/**
 * Edit targets and their keys. Type-only imports and no runtime dependencies: the public site's
 * Editable wrappers use targetKey, so nothing here may pull admin code or zod into its bundle.
 */

/** What an editor edits. Form mode and visual mode both address editors through these. */
export type EditTarget =
  | { kind: "barbers" }
  | { kind: "barber"; id: string }
  | { kind: "item"; category: CategoryKey; item: string }
  | { kind: "itemPhoto"; category: CategoryKey; item: string; index: 0 | 1 }
  | { kind: "intro"; category: CategoryKey }
  | { kind: "hours" }
  | { kind: "business" }
  | { kind: "chemicalNote" }
  | { kind: "image"; slot: ImageSlot };

/** A stable string for a target, e.g. "item:colour.roots", "itemPhoto:cut.cutting.1",
 *  "image:heroLeft" or "barber:<id>". */
export function targetKey(t: EditTarget): string {
  switch (t.kind) {
    case "barbers":
    case "hours":
    case "business":
    case "chemicalNote":
      return t.kind;
    case "barber":
      return `barber:${t.id}`;
    case "item":
      return `item:${t.category}.${t.item}`;
    case "itemPhoto":
      return `itemPhoto:${t.category}.${t.item}.${t.index}`;
    case "intro":
      return `intro:${t.category}`;
    case "image":
      return `image:${t.slot}`;
  }
}
