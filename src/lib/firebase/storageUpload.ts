import { ref, uploadBytesResumable, type UploadTaskSnapshot } from "firebase/storage";
import { getFirebaseStorageClient } from "./client";
import { FAMILY_ID } from "./config";

export type UploadProgress = { path: "original" | "thumbnail"; progress: number };

/**
 * Uploads under a client-generated folder id, independent of the eventual
 * Firestore gifticon id (which the server only mints after analysis). The
 * folder name has no meaning beyond "one upload session" — see
 * firebase/storage.rules, which only cares that it's under this family's
 * gifticons/ prefix.
 */
export function createUploadId(): string {
  return crypto.randomUUID();
}

function uploadOne(
  path: string,
  blob: Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  const storageRef = ref(getFirebaseStorageClient(), path);
  const task = uploadBytesResumable(storageRef, blob, { contentType: blob.type });

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes);
      },
      reject,
      () => resolve(path)
    );
  });
}

export async function uploadGifticonImages(
  uploadId: string,
  images: { original: Blob; thumbnail: Blob },
  onProgress?: (progress: UploadProgress) => void
): Promise<{ imagePath: string; thumbnailPath: string }> {
  const originalPath = `families/${FAMILY_ID}/gifticons/${uploadId}/original.jpg`;
  const thumbnailPath = `families/${FAMILY_ID}/gifticons/${uploadId}/thumbnail.jpg`;

  await Promise.all([
    uploadOne(originalPath, images.original, (progress) => onProgress?.({ path: "original", progress })),
    uploadOne(thumbnailPath, images.thumbnail, (progress) => onProgress?.({ path: "thumbnail", progress })),
  ]);

  return { imagePath: originalPath, thumbnailPath };
}
