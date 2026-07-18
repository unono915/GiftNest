import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { authAttemptsPath } from "@/lib/firebase/paths";

const WINDOW_MS = 10 * 60 * 1000; // 10분
const MAX_ATTEMPTS = 5;

type AttemptDoc = {
  failCount: number;
  windowStart: number;
  lockedUntil: number | null;
};

export type RateLimitCheck =
  | { locked: true; retryAfterMs: number }
  | { locked: false };

/**
 * PRD 5.1: 10분 동안 5회 실패 시 잠시 차단. Keyed by the client-generated
 * deviceId (there is no Firebase Auth session yet at this point in the PIN
 * flow), and only ever touched via Admin SDK — Security Rules deny all
 * client access to this collection.
 */
export async function checkRateLimit(deviceId: string): Promise<RateLimitCheck> {
  const ref = getAdminDb().doc(`${authAttemptsPath()}/${deviceId}`);
  const snap = await ref.get();
  if (!snap.exists) return { locked: false };

  const data = snap.data() as AttemptDoc;
  const now = Date.now();
  if (data.lockedUntil && data.lockedUntil > now) {
    return { locked: true, retryAfterMs: data.lockedUntil - now };
  }
  return { locked: false };
}

export async function recordFailedAttempt(deviceId: string): Promise<RateLimitCheck> {
  const ref = getAdminDb().doc(`${authAttemptsPath()}/${deviceId}`);
  const db = getAdminDb();

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.exists ? (snap.data() as AttemptDoc) : null;

    const windowExpired = !data || now - data.windowStart > WINDOW_MS;
    const failCount = windowExpired ? 1 : data!.failCount + 1;
    const windowStart = windowExpired ? now : data!.windowStart;
    const lockedUntil = failCount >= MAX_ATTEMPTS ? now + WINDOW_MS : null;

    tx.set(ref, { failCount, windowStart, lockedUntil } satisfies AttemptDoc);

    if (lockedUntil) return { locked: true, retryAfterMs: lockedUntil - now };
    return { locked: false };
  });
}

export async function clearRateLimit(deviceId: string): Promise<void> {
  await getAdminDb().doc(`${authAttemptsPath()}/${deviceId}`).delete();
}
