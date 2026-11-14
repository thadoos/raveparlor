"use client";

import {
  addItemPhoto,
  removeItemPhoto,
  setItemPhoto,
  setItemPhotoAlt,
} from "@/lib/admin/draft-ops";
import { itemPhotoFolder } from "@/lib/content/schema";
import type { CategoryKey, ImageRef, SiteContent } from "@/lib/content/schema";
import { PhotoEditor, PhotoPicker, usePhotoUpload } from "./PhotoEditor";
import type { EditorProps } from "./types";
import shared from "./Editor.module.css";
import styles from "./ItemPhotosEditor.module.css";

interface ItemPhotosEditorProps extends EditorProps {
  category: CategoryKey;
  item: string;
  /** Shows only this photo, e.g. when opened from that photo in visual mode. */
  index?: 0 | 1;
}

/** A service's modal photos: one or two, each with replace and alt text; add or remove the second. */
export function ItemPhotosEditor({ draft, apply, category, item, index }: ItemPhotosEditorProps) {
  const folder = itemPhotoFolder(category, item);
  // A new second photo starts with the first one's alt text, which usually fits and can be edited.
  const add = usePhotoUpload(folder, (image) =>
    apply((c) =>
      addItemPhoto(c, category, item, { ...image, alt: photoAlt(c, category, item, 0) }),
    ),
  );

  const data = Object.hasOwn(draft.services[category].items, item)
    ? draft.services[category].items[item]
    : undefined;
  if (!data) return <p className={shared.note}>This service no longer exists.</p>;

  const photos: readonly ImageRef[] = data.photos;
  const shown: (0 | 1)[] = index === undefined ? [0, 1] : [index];
  const visible = shown.filter((i) => i < photos.length);
  if (visible.length === 0) return <p className={shared.note}>This photo has been removed.</p>;

  return (
    <div className={shared.stack}>
      {visible.map((i) => (
        <div key={i} className={styles.photo}>
          {photos.length === 2 ? <p className="admin-label">Photo {i + 1}</p> : null}
          <PhotoEditor
            photo={photos[i]}
            folder={folder}
            onReplace={(image) =>
              apply((c) =>
                setItemPhoto(c, category, item, i, {
                  ...image,
                  alt: photoAlt(c, category, item, i),
                }),
              )
            }
            onAltChange={(alt) => apply((c) => setItemPhotoAlt(c, category, item, i, alt))}
            actions={
              i === 1 ? (
                <button
                  type="button"
                  className={`admin-button ${shared.secondary}`}
                  onClick={() => apply((c) => removeItemPhoto(c, category, item, 1))}
                >
                  Remove
                </button>
              ) : null
            }
          />
        </div>
      ))}

      {index === undefined && photos.length === 1 ? (
        <PhotoPicker label="Add a second photo" upload={add} />
      ) : null}
    </div>
  );
}

function photoAlt(c: SiteContent, category: CategoryKey, item: string, index: 0 | 1): string {
  const items = c.services[category].items;
  if (!Object.hasOwn(items, item)) return "";
  const photos: readonly ImageRef[] = items[item].photos;
  return photos.at(index)?.alt ?? "";
}
