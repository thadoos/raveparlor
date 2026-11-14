import { resizeImage } from "@/lib/admin/image-resize";
import { newId } from "@/lib/admin/uuid";
import type { ImageRef } from "@/lib/content/schema";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/** Browser-only: resizes a picked photo and uploads it to the site-images bucket. */

const BUCKET = "site-images";

/** A failed upload. `message` is written for the person editing, so editors can show it as is. */
export class UploadImageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "UploadImageError";
  }
}

const READ_ERROR = "Couldn't read that photo. Try a JPEG or PNG.";
const UPLOAD_ERROR = "Couldn't upload the photo. Check your connection and try again.";

/**
 * Resizes `file` and uploads it as `<folder>/<uuid>.webp` (or .jpg where the browser can't encode
 * WebP). Returns the new image's path and size; the caller supplies the alt text.
 * Throws UploadImageError when the file can't be read or the upload fails.
 */
export async function uploadImage(folder: string, file: File): Promise<Omit<ImageRef, "alt">> {
  let resized: Awaited<ReturnType<typeof resizeImage>>;
  try {
    resized = await resizeImage(file);
  } catch (error) {
    console.error("resizeImage failed:", error);
    throw new UploadImageError(READ_ERROR, { cause: error });
  }

  const { blob, width, height } = resized;
  const webp = blob.type === "image/webp";
  const path = `${folder}/${newId()}.${webp ? "webp" : "jpg"}`;
  const { error } = await createBrowserSupabase()
    .storage.from(BUCKET)
    .upload(path, blob, { contentType: webp ? "image/webp" : "image/jpeg" })
    .catch((e: unknown) => ({ error: e }));
  if (error) {
    console.error("Image upload failed:", error);
    throw new UploadImageError(UPLOAD_ERROR, { cause: error });
  }
  return { path, width, height };
}

/** The message to show for an error thrown by uploadImage. */
export function uploadErrorMessage(error: unknown): string {
  return error instanceof UploadImageError ? error.message : UPLOAD_ERROR;
}
