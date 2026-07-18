import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { devicesPath, membersPath } from "@/lib/firebase/paths";
import { nowIso } from "@/lib/dates/kst";
import { ApiError } from "@/server/http";
import type { CreateMemberInput, RegisterDeviceInput } from "@/lib/validation/members";

export async function createMember(input: CreateMemberInput) {
  const db = getAdminDb();
  const ref = db.collection(membersPath()).doc();
  const now = nowIso();
  const member = {
    id: ref.id,
    name: input.name,
    avatarEmoji: input.avatarEmoji,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(member);
  return member;
}

export async function updateMember(
  memberId: string,
  patch: { name?: string; avatarEmoji?: string; isActive?: boolean }
) {
  const db = getAdminDb();
  const ref = db.doc(`${membersPath()}/${memberId}`);

  if (patch.isActive === false) {
    // PRD 5.2: 최소 1명의 활성 구성원이 있어야 한다.
    const activeSnap = await db.collection(membersPath()).where("isActive", "==", true).get();
    const stillActiveAfter = activeSnap.docs.filter((doc) => doc.id !== memberId).length;
    if (stillActiveAfter === 0) {
      throw new ApiError(409, "최소 1명의 활성 가족 구성원이 있어야 합니다.");
    }
  }

  await ref.set({ ...patch, updatedAt: nowIso() }, { merge: true });
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, "구성원을 찾을 수 없습니다.");
  return snap.data();
}

export async function registerDevice(deviceId: string, input: RegisterDeviceInput) {
  const db = getAdminDb();
  const memberRef = db.doc(`${membersPath()}/${input.memberId}`);
  const memberSnap = await memberRef.get();
  if (!memberSnap.exists) {
    throw new ApiError(404, "존재하지 않는 구성원입니다.");
  }

  const deviceRef = db.doc(`${devicesPath()}/${deviceId}`);
  const existing = await deviceRef.get();
  const now = nowIso();

  const device = {
    id: deviceId,
    authUid: deviceId,
    memberId: input.memberId,
    name: input.deviceName,
    fcmTokens: existing.exists ? (existing.data()?.fcmTokens ?? []) : [],
    notificationsEnabled: existing.exists ? Boolean(existing.data()?.notificationsEnabled) : false,
    lastSeenAt: now,
    createdAt: existing.exists ? existing.data()?.createdAt ?? now : now,
    revokedAt: null,
  };

  await deviceRef.set(device);
  return device;
}
