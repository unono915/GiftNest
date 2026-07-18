import "server-only";
import bcrypt from "bcryptjs";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { settingsPath, devicesPath } from "@/lib/firebase/paths";
import { nowIso } from "@/lib/dates/kst";
import { ApiError } from "@/server/http";
import type { ChangePinInput } from "@/lib/validation/settings";

type AppSettingsDoc = {
  familyPinHash?: string;
  updatedAt?: string;
};

/**
 * PRD's `families/{familyId}/settings/app` doc is the runtime-mutable PIN
 * store: the deployed FAMILY_PIN_HASH env var seeds the very first login,
 * and any in-app "비밀번호 변경" writes here instead — env vars can't be
 * updated by a running server without a redeploy.
 */
export async function getEffectivePinHash(): Promise<string | null> {
  const snap = await getAdminDb().doc(settingsPath()).get();
  const stored = (snap.data() as AppSettingsDoc | undefined)?.familyPinHash;
  return stored ?? process.env.FAMILY_PIN_HASH ?? null;
}

export async function changeFamilyPin(deviceId: string, input: ChangePinInput) {
  const currentHash = await getEffectivePinHash();
  if (!currentHash) {
    throw new ApiError(500, "서버 설정 오류입니다.");
  }

  const isCurrentValid = await bcrypt.compare(input.currentPin, currentHash);
  if (!isCurrentValid) {
    throw new ApiError(401, "현재 비밀번호가 올바르지 않습니다.");
  }

  const newHash = await bcrypt.hash(input.newPin, 12);
  await getAdminDb()
    .doc(settingsPath())
    .set({ familyPinHash: newHash, updatedAt: nowIso() } satisfies AppSettingsDoc, { merge: true });

  if (input.logoutOtherDevices) {
    const devicesSnap = await getAdminDb().collection(devicesPath()).get();
    await Promise.all(
      devicesSnap.docs
        .filter((doc) => doc.id !== deviceId)
        .map((doc) => getAdminAuth().revokeRefreshTokens(doc.id).catch(() => undefined))
    );
  }
}
