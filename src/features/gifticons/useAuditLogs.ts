"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { auditLogsPath } from "@/lib/firebase/paths";
import type { AuditLog } from "@/types/domain";

/** No orderBy in the query itself (avoids needing a composite index for gifticonId== + createdAt orderBy) — sorted client-side instead, fine at this collection's scale. */
export function useAuditLogs(gifticonId: string) {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const q = query(collection(getFirebaseDb(), auditLogsPath()), where("gifticonId", "==", gifticonId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => d.data() as AuditLog);
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setLogs(items);
    });
    return unsubscribe;
  }, [gifticonId]);

  return logs;
}
