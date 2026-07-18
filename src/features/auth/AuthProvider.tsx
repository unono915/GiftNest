"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { devicesPath, membersPath } from "@/lib/firebase/paths";
import { clearLocalDeviceId, getOrCreateLocalDeviceId } from "@/lib/device/deviceId";
import type { Device, Member } from "@/types/domain";

type AuthStatus = "checking" | "signed-out" | "needs-profile" | "ready";

type PinLoginResult =
  | { success: true; requiresProfile: boolean }
  | { success: false; error: string; retryAfterMs?: number };

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  device: Device | null;
  member: Member | null;
  signInWithPin: (pin: string) => Promise<PinLoginResult>;
  signOutDevice: () => Promise<void>;
  refreshIdToken: () => Promise<string | null>;
  /**
   * Optimistically applies a just-registered device so `status` flips to
   * "ready" immediately, instead of waiting on the Firestore listener to
   * observe the server write. Re-authenticating in the same tab (e.g.
   * logout then immediately logging back in) can leave that listener slow
   * to re-fire; the listener still takes over as the source of truth right
   * after.
   */
  applyRegisteredDevice: (device: Device) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type KeyedDeviceState = { uid: string; device: Device | null };
type KeyedMemberState = { memberId: string; member: Member | null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [deviceState, setDeviceState] = useState<KeyedDeviceState | null>(null);
  const [memberState, setMemberState] = useState<KeyedMemberState | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      doc(getFirebaseDb(), `${devicesPath()}/${user.uid}`),
      (snap) => setDeviceState({ uid: user.uid, device: snap.exists() ? (snap.data() as Device) : null }),
      () => setDeviceState({ uid: user.uid, device: null })
    );
    return unsubscribe;
  }, [user]);

  // Keyed by uid so a stale device from a previous user never leaks through
  // while the new user's subscription is still loading (see status below).
  const device = user && deviceState?.uid === user.uid ? deviceState.device : null;
  const deviceLoaded = !user || deviceState?.uid === user.uid;

  useEffect(() => {
    if (!device?.memberId) return;
    const memberId = device.memberId;
    const unsubscribe = onSnapshot(
      doc(getFirebaseDb(), `${membersPath()}/${memberId}`),
      (snap) => setMemberState({ memberId, member: snap.exists() ? (snap.data() as Member) : null })
    );
    return unsubscribe;
  }, [device?.memberId]);

  const member = device?.memberId && memberState?.memberId === device.memberId ? memberState.member : null;

  const status: AuthStatus = !authChecked
    ? "checking"
    : !user
      ? "signed-out"
      : !deviceLoaded
        ? "checking"
        : device?.memberId
          ? "ready"
          : "needs-profile";

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      device,
      member,
      async signInWithPin(pin: string): Promise<PinLoginResult> {
        const deviceId = getOrCreateLocalDeviceId();
        const response = await fetch("/api/auth/pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin, deviceId }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          return { success: false, error: data.error ?? "로그인에 실패했습니다.", retryAfterMs: data.retryAfterMs };
        }
        await signInWithCustomToken(getFirebaseAuth(), data.customToken);
        return { success: true, requiresProfile: data.requiresProfile };
      },
      async signOutDevice() {
        await firebaseSignOut(getFirebaseAuth());
        clearLocalDeviceId();
      },
      async refreshIdToken() {
        const current = getFirebaseAuth().currentUser;
        if (!current) return null;
        return current.getIdToken();
      },
      applyRegisteredDevice(device: Device) {
        setDeviceState({ uid: device.id, device });
      },
    }),
    [status, user, device, member]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
