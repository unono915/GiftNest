const HEIC_TYPES = ["image/heic", "image/heif"];
const HEIC_EXTENSIONS = [".heic", ".heif"];

export function looksLikeHeic(file: File): boolean {
  if (HEIC_TYPES.includes(file.type.toLowerCase())) return true;
  const lowerName = file.name.toLowerCase();
  return HEIC_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

/**
 * PRD 5.3: HEIC/HEIF는 업로드 전에 JPEG로 변환한다. Most browsers can't
 * decode HEIC via canvas/createImageBitmap, so this converts client-side
 * before any resize/upload step ever sees the file.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([blob], newName, { type: "image/jpeg" });
}
