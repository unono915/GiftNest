import { firebaseWebConfig } from "@/lib/firebase/config";

/**
 * Served as a real /firebase-messaging-sw.js file (not proxied) so it can
 * register at the origin's root scope. Generated from env vars instead of
 * a static public/ file so it doesn't hardcode which Firebase project it
 * points at.
 */
export async function GET() {
  const script = `
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(firebaseWebConfig)});

const messaging = firebase.messaging();

// PRD 5.11: 잠금 화면에 쿠폰 번호나 바코드가 노출되지 않도록 한다 — the
// payload built server-side (see src/server/notifications/service.ts)
// never includes those fields in the first place, so there is nothing to
// filter here.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "GiftNest";
  const body = payload.notification?.body ?? "";
  const gifticonId = payload.data?.gifticonId;
  const url = gifticonId ? "/gifticons/" + gifticonId : "/gifticons";

  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/gifticons";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
`.trim();

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
      "Service-Worker-Allowed": "/",
    },
  });
}
