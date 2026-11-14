"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { ChangeEvent } from "react";
import { setImage, setImageAlt } from "@/lib/admin/draft-ops";
import { resizeImage } from "@/lib/admin/image-resize";
import { newId } from "@/lib/admin/uuid";
import type { ImageSlot } from "@/lib/content/schema";
import { resolveImage } from "@/lib/content/view";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { TextField } from "./TextField";
import type { EditorProps } from "./types";
import shared from "./Editor.module.css";
import fields from "./fields.module.css";
import styles from "./ImageSlotEditor.module.css";

interface ImageSlotEditorProps extends EditorProps {
  slot: ImageSlot;
}

const BUCKET = "site-images";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const READ_ERROR = "Couldn't read that photo. Try a JPEG or PNG.";
const UPLOAD_ERROR = "Couldn't upload the photo. Check your connection and try again.";

type Upload = { state: "idle" } | { state: "uploading" } | { state: "error"; message: string };

/** One image slot: preview, replace (resized in the browser, then uploaded) and alt text. */
export function ImageSlotEditor({ draft, apply, slot }: ImageSlotEditorProps) {
  const inputId = useId();
  const [upload, setUpload] = useState<Upload>({ state: "idle" });
  const ref = draft.images[slot];
  const image = resolveImage(ref, SUPABASE_URL);
  const busy = upload.state === "uploading";

  async function replace(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // Clear it, so picking the same file again still fires a change.
    input.value = "";
    if (!file) return;

    setUpload({ state: "uploading" });
    let resized: Awaited<ReturnType<typeof resizeImage>>;
    try {
      resized = await resizeImage(file);
    } catch (error) {
      console.error("resizeImage failed:", error);
      setUpload({ state: "error", message: READ_ERROR });
      return;
    }

    const { blob, width, height } = resized;
    const webp = blob.type === "image/webp";
    const path = `${slot}/${newId()}.${webp ? "webp" : "jpg"}`;
    const { error } = await createBrowserSupabase()
      .storage.from(BUCKET)
      .upload(path, blob, { contentType: webp ? "image/webp" : "image/jpeg" })
      .catch((e: unknown) => ({ error: e }));
    if (error) {
      console.error("Image upload failed:", error);
      setUpload({ state: "error", message: UPLOAD_ERROR });
      return;
    }

    apply((c) => setImage(c, slot, { path, alt: c.images[slot].alt, width, height }));
    setUpload({ state: "idle" });
  }

  return (
    <div className={shared.stack}>
      <div className={styles.preview}>
        <Image
          key={image.src}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(min-width: 820px) 40vw, 100vw"
          className={styles.image}
        />
        {busy ? <div className={styles.busy}>Uploading…</div> : null}
      </div>

      <div>
        <label
          htmlFor={inputId}
          className={`admin-button ${shared.secondary} ${styles.replace}`}
          aria-disabled={busy || undefined}
        >
          {busy ? "Uploading…" : "Replace photo"}
        </label>
        <input
          id={inputId}
          className={styles.file}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={replace}
        />
        {upload.state === "error" ? (
          <p className={fields.error} role="alert">
            {upload.message}
          </p>
        ) : null}
      </div>

      <TextField
        label="Alt text"
        value={ref.alt}
        onChange={(alt) => apply((c) => setImageAlt(c, slot, alt))}
        hint="Describe the photo for screen readers and search engines."
      />
    </div>
  );
}
