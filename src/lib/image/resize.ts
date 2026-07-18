export type PreparedImage = {
  blob: Blob;
  width: number;
  height: number;
};

/**
 * Decodes with `imageOrientation: "from-image"` so EXIF rotation is baked
 * into the resulting bitmap once, here — every downstream copy (original,
 * analysis, thumbnail) is then already orientation-correct without needing
 * a separate EXIF-parsing step (PRD 5.3: "이미지 방향 정보를 보정한다").
 */
async function decodeOriented(source: Blob): Promise<ImageBitmap> {
  return createImageBitmap(source, { imageOrientation: "from-image" });
}

async function drawToBlob(
  bitmap: ImageBitmap,
  maxDimension: number,
  quality: number,
  mimeType: string
): Promise<PreparedImage> {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context를 생성할 수 없습니다.");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, quality));
  if (!blob) throw new Error("이미지를 변환하지 못했습니다.");

  return { blob, width, height };
}

const ORIGINAL_MAX_DIMENSION = 2400;
const ANALYSIS_MAX_DIMENSION = 1600;
const THUMBNAIL_MAX_DIMENSION = 320;

export type PreparedImageSet = {
  original: PreparedImage;
  analysis: PreparedImage;
  thumbnail: PreparedImage;
};

/**
 * Produces all three variants PRD 5.3 asks for from one decode:
 * a bright, orientation-corrected "original" (compressed just enough to
 * keep barcodes readable), a smaller copy for Gemini analysis, and a
 * thumbnail for list views.
 */
export async function prepareImageVariants(file: File | Blob): Promise<PreparedImageSet> {
  const bitmap = await decodeOriented(file);
  try {
    const [original, analysis, thumbnail] = await Promise.all([
      drawToBlob(bitmap, ORIGINAL_MAX_DIMENSION, 0.92, "image/jpeg"),
      drawToBlob(bitmap, ANALYSIS_MAX_DIMENSION, 0.85, "image/jpeg"),
      drawToBlob(bitmap, THUMBNAIL_MAX_DIMENSION, 0.8, "image/jpeg"),
    ]);
    return { original, analysis, thumbnail };
  } finally {
    bitmap.close();
  }
}
