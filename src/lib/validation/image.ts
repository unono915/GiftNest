export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Analysis payload is the client-resized copy, so this is much smaller than the original-upload cap (see firebase/storage.rules, 15MB). */
export const MAX_ANALYSIS_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_ORIGINAL_IMAGE_BYTES = 15 * 1024 * 1024;

export function isAllowedImageMimeType(mimeType: string): mimeType is (typeof ALLOWED_IMAGE_MIME_TYPES)[number] {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}
