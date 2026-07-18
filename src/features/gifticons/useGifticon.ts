"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { gifticonsPath } from "@/lib/firebase/paths";
import { computeGifticonStatus } from "@/lib/dates/status";
import type { Gifticon } from "@/types/domain";

export function useGifticon(id: string) {
  const [gifticon, setGifticon] = useState<Gifticon | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(getFirebaseDb(), `${gifticonsPath()}/${id}`),
      (snap) => {
        if (!snap.exists()) {
          setGifticon(null);
          return;
        }
        const data = snap.data() as Gifticon;
        if (data.deletedAt) {
          setGifticon(null);
          return;
        }
        const status = computeGifticonStatus({
          usedAt: data.usedAt,
          expirationDate: data.expirationDate,
          needsReview: data.needsReview,
          plannedMemberId: data.plannedMemberId,
          archivedAt: data.archivedAt,
        });
        setGifticon(status === data.status ? data : { ...data, status });
      },
      () => setGifticon(null)
    );
    return unsubscribe;
  }, [id]);

  // undefined = loading, null = not found
  return { gifticon, loading: gifticon === undefined };
}
