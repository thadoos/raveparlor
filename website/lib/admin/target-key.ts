import type { CategoryKey, ImageSlot } from "@/lib/content/schema";

/**
 * Edit targets and their keys. Type-only imports and no runtime dependencies: the public site's
 * Editable wrappers use targetKey, so nothing here may pull admin code or zod into its bundle.
 */

/** What an editor edits. Form mode and visual mode both address editors through these. */
export type EditTarget =
  | { kind: "barbers" }
  | { kind: "barber"; id: string }
  | {
      kind: "item";
      category: CategoryKey;
      item: string;
      /** Where the editor opens: "pricing" scrolls to the price grid (the dialog's price area). */
      focus?: "pricing";
    }
  | { kind: "itemPhoto"; category: CategoryKey; item: string; index: 0 | 1 }
  | { kind: "intro"; category: CategoryKey }
  | { kind: "hours" }
  | { kind: "business" }
  | { kind: "chemicalNote" }
  | { kind: "hero" }
  | { kind: "reviews" }
  | { kind: "image"; slot: ImageSlot };

/** A stable string for a target, e.g. "item:colour.roots", "item:colour.roots#pricing",
 *  "itemPhoto:cut.cutting.1",
 *  "image:heroLeft" or "barber:<id>". */
export function targetKey(t: EditTarget): string {
  switch (t.kind) {
    case "barbers":
    case "hours":
    case "business":
    case "chemicalNote":
    case "hero":
    case "reviews":
      return t.kind;
    case "barber":
      return `barber:${t.id}`;
    case "item":
      return `item:${t.category}.${t.item}${t.focus ? `#${t.focus}` : ""}`;
    case "itemPhoto":
      return `itemPhoto:${t.category}.${t.item}.${t.index}`;
    case "intro":
      return `intro:${t.category}`;
    case "image":
      return `image:${t.slot}`;
  }
}
