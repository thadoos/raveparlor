import type { EditTarget } from "@/lib/admin/target-key";
import { CATEGORY_KEYS } from "@/lib/content/schema";
import type { SiteContent } from "@/lib/content/schema";
import { MENU_STRUCTURE } from "@/lib/content/structure";

/** Things worth a second look before publishing. Advisory only: they never block a publish. */
export interface ContentWarning {
  kind: "staleBarberName";
  message: string;
  /** The editor that fixes it, so the publish dialog can link there. */
  target?: EditTarget;
}

const ITEM_FIELDS = [
  ["desc", "description"],
  ["ideal", "“ideal for” text"],
  ["note", "note"],
] as const;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Matches `name` as a whole word, ignoring case. Letters and digits on either side break the match. */
function wordPattern(name: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(name)}(?![\\p{L}\\p{N}])`, "iu");
}

interface CopyField {
  label: string;
  text: string;
  target: EditTarget;
}

/** Every copy field in the draft, labelled with its service and field. */
function copyFields(c: SiteContent): CopyField[] {
  const fields: CopyField[] = [];
  for (const category of CATEGORY_KEYS) {
    const structure = MENU_STRUCTURE[category];
    const content = c.services[category];
    content.intro.forEach((text, i) =>
      fields.push({
        label: `${structure.name} intro (paragraph ${i + 1})`,
        text,
        target: { kind: "intro", category },
      }),
    );
    for (const item of structure.items) {
      const data = content.items[item.key];
      if (!data) continue;
      for (const [key, name] of ITEM_FIELDS) {
        const text = data[key];
        if (text) {
          fields.push({
            label: `${item.name} ${name}`,
            text,
            target: { kind: "item", category, item: item.key },
          });
        }
      }
    }
  }
  fields.push({
    label: "The chemical services note",
    text: c.sharedNotes.chemical,
    target: { kind: "chemicalNote" },
  });
  return fields;
}

export function contentWarnings(published: SiteContent, draft: SiteContent): ContentWarning[] {
  const warnings: ContentWarning[] = [];
  const remaining = new Set(draft.barbers.map((b) => b.name.trim().toLowerCase()));
  const removed = published.barbers
    .map((b) => b.name.trim())
    .filter((name) => !remaining.has(name.toLowerCase()));
  if (removed.length === 0) return warnings;

  const fields = copyFields(draft);
  for (const name of removed) {
    const pattern = wordPattern(name);
    for (const field of fields) {
      if (pattern.test(field.text)) {
        warnings.push({
          kind: "staleBarberName",
          message: `${field.label} mentions ${name}, who is no longer a barber.`,
          target: field.target,
        });
      }
    }
  }
  return warnings;
}
