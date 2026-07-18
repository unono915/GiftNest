import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { devicesPath } from "@/lib/firebase/paths";
import { ApiError } from "@/server/http";

export type Actor = { memberId: string; deviceId: string };

/** Resolves the acting family member from a device's own registration — every mutating route needs this for createdBy/audit-log attribution. */
export async function getActor(deviceId: string): Promise<Actor> {
  const snap = await getAdminDb().doc(`${devicesPath()}/${deviceId}`).get();
  const memberId = snap.data()?.memberId;
  if (!snap.exists || !memberId) {
    throw new ApiError(403, "기기 프로필이 등록되지 않았습니다.");
  }
  return { memberId, deviceId };
}
