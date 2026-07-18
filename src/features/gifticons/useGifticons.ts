"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { gifticonsPath } from "@/lib/firebase/paths";
import { computeGifticonStatus } from "@/lib/dates/status";
import type { Gifticon } from "@/types/domain";

export function useGifticons() {
  const [gifticons, setGifticons] = useState<Gifticon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(getFirebaseDb(), gifticonsPath()), where("deletedAt", "==", null));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        // Status is recomputed client-side too (not just trusted from the
        // stored field) so a gifticon that silently crossed its expiration
        // date since the last server write still shows correctly without
        // waiting for any write to happen (PRD 5.10: server owns the
        // computation, but nothing here should ever *disagree* with it).
        const items = snap.docs.map((doc) => {
          const data = doc.data() as Gifticon;
          const status = computeGifticonStatus({
            usedAt: data.usedAt,
            expirationDate: data.expirationDate,
            needsReview: data.needsReview,
            plannedMemberId: data.plannedMemberId,
            archivedAt: data.archivedAt,
          });
          return status === data.status ? data : { ...data, status };
        });
        setGifticons(items);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, []);

  return { gifticons, loading };
}
