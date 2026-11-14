"use client";

import type { ReactNode } from "react";
import { EditorFor } from "@/components/admin/editors/EditorFor";
import type { EditorProps } from "@/components/admin/editors/types";
import { IMAGE_GROUPS, targetKey, targetLabel } from "@/lib/admin/targets";
import type { EditTarget } from "@/lib/admin/targets";
import { CATEGORY_KEYS } from "@/lib/content/schema";
import { MENU_STRUCTURE } from "@/lib/content/structure";
import styles from "./FormMode.module.css";

const SECTIONS = [
  { id: "form-barbers", title: "Barbers" },
  { id: "form-services", title: "Services and prices" },
  { id: "form-hours", title: "Opening hours" },
  { id: "form-business", title: "Business" },
  { id: "form-images", title: "Images" },
] as const;

const cardId = (target: EditTarget) => `edit-${targetKey(target)}`;

function openTarget(target: EditTarget) {
  document.getElementById(cardId(target))?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Every editor on one page, as section cards: one column on phones, two from 820px. */
export function FormMode({ draft, apply }: EditorProps) {
  const card = (target: EditTarget) => (
    <section
      key={targetKey(target)}
      id={cardId(target)}
      className={styles.card}
      aria-label={targetLabel(target, draft)}
    >
      <h3 className={styles.cardTitle}>{targetLabel(target, draft)}</h3>
      <EditorFor target={target} draft={draft} apply={apply} onOpenTarget={openTarget} />
    </section>
  );

  return (
    <div className={styles.form}>
      <nav className={styles.nav} aria-label="Sections">
        {SECTIONS.map((section) => (
          <a key={section.id} href={`#${section.id}`} className={styles.navLink}>
            {section.title}
          </a>
        ))}
      </nav>

      <Section id="form-barbers" title="Barbers">
        {card({ kind: "barbers" })}
      </Section>

      <Section id="form-services" title="Services and prices">
        {CATEGORY_KEYS.map((category) => (
          <div key={category} className={styles.group}>
            <h3 className={styles.groupTitle}>{MENU_STRUCTURE[category].name}</h3>
            <div className={styles.grid}>
              {card({ kind: "intro", category })}
              {MENU_STRUCTURE[category].items.map((item) =>
                card({ kind: "item", category, item: item.key }),
              )}
            </div>
          </div>
        ))}
      </Section>

      <Section id="form-hours" title="Opening hours">
        {card({ kind: "hours" })}
      </Section>

      <Section id="form-business" title="Business">
        {card({ kind: "business" })}
      </Section>

      <Section id="form-images" title="Images">
        {IMAGE_GROUPS.map((group) => (
          <div key={group.title} className={styles.group}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            <div className={styles.grid}>
              {group.slots.map((slot) => card({ kind: "image", slot }))}
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.sectionTitle}>
        {title}
      </h2>
      <div className={styles.grid}>{children}</div>
    </section>
  );
}
