/** Shrinks photos in the browser before upload. fitWithin is pure; resizeImage needs a browser. */

/** Scales (width, height) down proportionally so the longer edge is at most maxEdge. Never upscales. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge = 2400,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function encode(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type, quality });
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Decodes the file, scales it to fit maxEdge and encodes it as WebP. Browsers that can't encode
 * WebP (older Safari quietly returns PNG) get a JPEG instead, so check `blob.type`.
 * Throws when the file can't be decoded.
 */
export async function resizeImage(
  file: File,
  maxEdge = 2400,
  quality = 0.85,
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge);
    let canvas: OffscreenCanvas | HTMLCanvasElement;
    if (typeof OffscreenCanvas === "undefined") {
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
    } else {
      canvas = new OffscreenCanvas(width, height);
    }
    const context = canvas.getContext("2d") as
      OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
    if (!context) throw new Error("Canvas 2D is unavailable");
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);

    let blob = await encode(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") blob = await encode(canvas, "image/jpeg", quality);
    if (!blob) throw new Error("Couldn't encode the image");
    return { blob, width, height };
  } finally {
    bitmap.close();
  }
}
