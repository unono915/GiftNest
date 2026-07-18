"use client";

import { getToken, getMessaging, isSupported } from "firebase/messaging";
import { getFirebaseApp } from "./client";

export type NotificationSetupResult =
  | { status: "granted"; token: string }
  | { status: "denied" }
  | { status: "unsupported" }
  | { status: "error"; error: string };

/**
 * PRD 5.11: 알림 권한은 첫 화면에서 즉시 요구하지 않는다 — this is only
 * ever called from a user-initiated action in the settings screen, never
 * on mount.
 */
export async function setupPushNotifications(): Promise<NotificationSetupResult> {
  if (typeof window === "undefined" || !(await isSupported().catch(() => false))) {
    return { status: "unsupported" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { status: "denied" };
  }

  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(getFirebaseApp());
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) return { status: "error", error: "토큰을 발급받지 못했습니다." };
    return { status: "granted", token };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : "알 수 없는 오류" };
  }
}
