const DEVICE_ID_KEY = "giftnest_device_id";

/**
 * A device keeps one stable id for its whole lifetime and that id doubles as
 * its Firebase Auth uid (see /api/auth/pin) — this is what makes "기기별
 * 인증" (PRD 5.1) work: one browser/profile == one Auth identity == one
 * devices/{id} document. Clearing site data loses this id, which is the
 * intended way a device becomes "unauthenticated" again.
 */
export function getOrCreateLocalDeviceId(): string {
  if (typeof window === "undefined") {
    throw new Error("getOrCreateLocalDeviceId can only run in the browser");
  }
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const created = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

export function clearLocalDeviceId(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEVICE_ID_KEY);
}
