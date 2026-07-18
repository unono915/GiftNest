"use client";

import { useEffect, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { getFirebaseStorageClient } from "./client";

const urlCache = new Map<string, string>();

type Resolved = { path: string; url: string | null };

/** Resolves a Storage path (as stored on the Gifticon doc) to a viewable download URL, cached per path for the session. */
export function useStorageUrl(path: string | null): string | null {
  const [resolved, setResolved] = useState<Resolved | null>(null);

  useEffect(() => {
    if (!path || urlCache.has(path)) return;
    let cancelled = false;
    getDownloadURL(ref(getFirebaseStorageClient(), path))
      .then((downloadUrl) => {
        urlCache.set(path, downloadUrl);
        if (!cancelled) setResolved({ path, url: downloadUrl });
      })
      .catch(() => {
        if (!cancelled) setResolved({ path, url: null });
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) return null;
  const cached = urlCache.get(path);
  if (cached) return cached;
  return resolved?.path === path ? resolved.url : null;
}
