import "server-only";
import { getMessaging } from "firebase-admin/messaging";
import { getAdminApp, getAdminDb } from "@/lib/firebase/admin";
import { devicesPath, gifticonsPath, membersPath, notificationLogsPath } from "@/lib/firebase/paths";
import { todayKst, nowIso } from "@/lib/dates/kst";
import {
  buildExpiryDigestGroups,
  buildPlanReminders,
  composeExpiryDigestMessage,
  composePlanReminderMessage,
} from "@/lib/notifications/digest";
import type { Device, Gifticon, Member, NotificationType } from "@/types/domain";

function logKey(deviceId: string, type: NotificationType, gifticonId: string): string {
  return `${deviceId}|${type}|${gifticonId}`;
}

async function loadAlreadySentKeys(targetDate: string): Promise<Set<string>> {
  const snap = await getAdminDb()
    .collection(notificationLogsPath())
    .where("targetDate", "==", targetDate)
    .get();
  return new Set(snap.docs.map((d) => logKey(d.data().deviceId, d.data().type, d.data().gifticonId)));
}

async function writeLogs(
  entries: { gifticonId: string; deviceId: string; type: NotificationType; targetDate: string; status: "sent" | "failed" | "skipped" }[]
): Promise<void> {
  const db = getAdminDb();
  const batch = db.batch();
  for (const entry of entries) {
    const ref = db.collection(notificationLogsPath()).doc();
    batch.set(ref, { id: ref.id, ...entry, sentAt: nowIso() });
  }
  await batch.commit();
}

export type DailyNotificationSummary = {
  devicesNotified: number;
  notificationsSent: number;
  notificationsFailed: number;
};

/**
 * PRD 5.11 정기 실행: runs once daily (Vercel Cron, see /api/internal/notifications/daily).
 * Never sends to a used/archived/deleted gifticon, and relies on
 * NotificationLog (deviceId+type+gifticonId+targetDate) so re-running the
 * same day is a safe no-op even if the cron fires twice.
 */
export async function sendDailyNotifications(): Promise<DailyNotificationSummary> {
  const today = todayKst();
  const db = getAdminDb();

  const [devicesSnap, gifticonsSnap, membersSnap, alreadySent] = await Promise.all([
    db.collection(devicesPath()).where("notificationsEnabled", "==", true).get(),
    db.collection(gifticonsPath()).where("deletedAt", "==", null).get(),
    db.collection(membersPath()).get(),
    loadAlreadySentKeys(today),
  ]);

  const devices = devicesSnap.docs.map((d) => d.data() as Device).filter((d) => d.fcmTokens.length > 0);
  const gifticons = gifticonsSnap.docs.map((d) => d.data() as Gifticon);
  const members = membersSnap.docs.map((d) => d.data() as Member);

  const expiryGroups = buildExpiryDigestGroups(gifticons, today);
  const planReminders = buildPlanReminders(gifticons, today);

  const messaging = getMessaging(getAdminApp());
  let notificationsSent = 0;
  let notificationsFailed = 0;
  const devicesNotifiedSet = new Set<string>();

  for (const device of devices) {
    const logEntries: Parameters<typeof writeLogs>[0] = [];

    for (const group of expiryGroups) {
      const unsent = group.gifticons.filter((g) => !alreadySent.has(logKey(device.id, group.type, g.id)));
      if (unsent.length === 0) continue;

      const message = composeExpiryDigestMessage({ type: group.type, gifticons: unsent });
      const result = await messaging
        .sendEachForMulticast({
          tokens: device.fcmTokens,
          notification: message,
          data: { gifticonId: unsent[0].id },
        })
        .catch(() => null);

      const status = result && result.successCount > 0 ? "sent" : "failed";
      for (const g of unsent) {
        logEntries.push({ gifticonId: g.id, deviceId: device.id, type: group.type, targetDate: today, status });
      }
      if (status === "sent") notificationsSent += 1;
      else notificationsFailed += 1;
    }

    for (const reminder of planReminders) {
      if (alreadySent.has(logKey(device.id, reminder.type, reminder.gifticon.id))) continue;

      const plannedMember = members.find((m) => m.id === reminder.gifticon.plannedMemberId);
      const message = composePlanReminderMessage(reminder, plannedMember?.name ?? null);
      const result = await messaging
        .sendEachForMulticast({
          tokens: device.fcmTokens,
          notification: message,
          data: { gifticonId: reminder.gifticon.id },
        })
        .catch(() => null);

      const status = result && result.successCount > 0 ? "sent" : "failed";
      logEntries.push({
        gifticonId: reminder.gifticon.id,
        deviceId: device.id,
        type: reminder.type,
        targetDate: today,
        status,
      });
      if (status === "sent") notificationsSent += 1;
      else notificationsFailed += 1;
    }

    if (logEntries.length > 0) {
      devicesNotifiedSet.add(device.id);
      await writeLogs(logEntries);
    }
  }

  return {
    devicesNotified: devicesNotifiedSet.size,
    notificationsSent,
    notificationsFailed,
  };
}
