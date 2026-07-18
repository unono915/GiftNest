import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { devicesPath } from "@/lib/firebase/paths";
import { nowIso } from "@/lib/dates/kst";
import { ApiError } from "@/server/http";

export async function registerPushToken(deviceId: string, token: string): Promise<void> {
  const ref = getAdminDb().doc(`${devicesPath()}/${deviceId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, "기기를 찾을 수 없습니다.");

  await ref.set(
    {
      fcmTokens: FieldValue.arrayUnion(token),
      notificationsEnabled: true,
      lastSeenAt: nowIso(),
    },
    { merge: true }
  );
}

export async function disablePushNotifications(deviceId: string): Promise<void> {
  const ref = getAdminDb().doc(`${devicesPath()}/${deviceId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, "기기를 찾을 수 없습니다.");

  await ref.set({ notificationsEnabled: false, lastSeenAt: nowIso() }, { merge: true });
}
