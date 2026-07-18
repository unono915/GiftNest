import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { auditLogsPath } from "@/lib/firebase/paths";
import { nowIso } from "@/lib/dates/kst";
import type { AuditAction } from "@/types/domain";

export async function recordAuditLog(params: {
  gifticonId: string;
  memberId: string;
  deviceId: string;
  action: AuditAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): Promise<void> {
  const ref = getAdminDb().collection(auditLogsPath()).doc();
  await ref.set({
    id: ref.id,
    gifticonId: params.gifticonId,
    memberId: params.memberId,
    deviceId: params.deviceId,
    action: params.action,
    before: params.before,
    after: params.after,
    createdAt: nowIso(),
  });
}
