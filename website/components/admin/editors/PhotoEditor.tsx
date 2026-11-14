"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { uploadErrorMessage, uploadImage } from "@/lib/admin/upload-image";
import type { ImageRef } from "@/lib/content/schema";
import { resolveImage } from "@/lib/content/view";
import { TextField } from "./TextField";
import shared from "./Editor.module.css";
import fields from "./fields.module.css";
import styles from "./PhotoEditor.module.css";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

type UploadState = { state: "idle" } | { state: "uploading" } | { state: "error"; message: string };

export interface PhotoUpload {
  state: UploadState;
  pick: (event: ChangeEvent<HTMLInputElement>) => void;
}

/** Upload state for a file input: uploads the picked photo to `folder`, then hands it over. */
export function usePhotoUpload(
  folder: string,
  onUploaded: (image: Omit<ImageRef, "alt">) => void,
): PhotoUpload {
  const [state, setState] = useState<UploadState>({ state: "idle" });

  async function upload(file: File) {
    setState({ state: "uploading" });
    try {
      const image = await uploadImage(folder, file);
      onUploaded(image);
      setState({ state: "idle" });
    } catch (error) {
      setState({ state: "error", message: uploadErrorMessage(error) });
    }
  }

  function pick(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // Clear it, so picking the same file again still fires a change.
    input.value = "";
    if (file) void upload(file);
  }

  return { state, pick };
}

interface PhotoPickerProps {
  label: string;
  upload: PhotoUpload;
}

/** A button-styled label over a hidden file input, with the upload error below it. */
export function PhotoPicker({ label, upload }: PhotoPickerProps) {
  const inputId = useId();
  const busy = upload.state.state === "uploading";
  return (
    <div>
      <label
        htmlFor={inputId}
        className={`admin-button ${shared.secondary} ${styles.replace}`}
        aria-disabled={busy || undefined}
      >
        {busy ? "Uploading…" : label}
      </label>
      <input
        id={inputId}
        className={styles.file}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        onChange={upload.pick}
      />
      {upload.state.state === "error" ? (
        <p className={fields.error} role="alert">
          {upload.state.message}
        </p>
      ) : null}
    </div>
  );
}

interface PhotoEditorProps {
  photo: ImageRef;
  /** Storage folder that replacements are uploaded to. */
  folder: string;
  /** A replacement was uploaded. The caller keeps the current alt text. */
  onReplace: (image: Omit<ImageRef, "alt">) => void;
  onAltChange: (alt: string) => void;
  /** Extra controls under the replace button, e.g. "Remove". */
  actions?: ReactNode;
  /** Which photo this is, e.g. "Photo 2", when there are several: names its fields apart. */
  name?: string;
}

/** One photo: preview, replace (resized in the browser, then uploaded) and alt text. */
export function PhotoEditor({
  photo,
  folder,
  onReplace,
  onAltChange,
  actions,
  name,
}: PhotoEditorProps) {
  const upload = usePhotoUpload(folder, onReplace);
  const image = resolveImage(photo, SUPABASE_URL);

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
        {upload.state.state === "uploading" ? <div className={styles.busy}>Uploading…</div> : null}
      </div>

      <div className={styles.actions}>
        <PhotoPicker
          label={name ? `Replace ${name.toLowerCase()}` : "Replace photo"}
          upload={upload}
        />
        {actions}
      </div>

      <TextField
        label={name ? `${name} alt text` : "Alt text"}
        value={photo.alt}
        onChange={onAltChange}
        hint="Describe the photo for screen readers and search engines."
      />
    </div>
  );
}
