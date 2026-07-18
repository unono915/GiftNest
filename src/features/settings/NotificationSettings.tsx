"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { useAuth } from "@/features/auth/AuthProvider";
import { setupPushNotifications } from "@/lib/firebase/messaging";
import { authedFetch } from "@/lib/api/client";

export function NotificationSettings() {
  const { device } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = Boolean(device?.notificationsEnabled);

  async function handleEnable() {
    setPending(true);
    setError(null);
    try {
      const result = await setupPushNotifications();
      if (result.status === "unsupported") {
        setError("이 브라우저는 웹 푸시 알림을 지원하지 않습니다.");
        return;
      }
      if (result.status === "denied") {
        setError("알림 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.");
        return;
      }
      if (result.status === "error") {
        setError(result.error);
        return;
      }
      const response = await authedFetch("/api/devices/push-token", {
        method: "POST",
        body: JSON.stringify({ token: result.token }),
      });
      if (!response.ok) throw new Error("토큰 등록에 실패했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알림 설정에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  async function handleDisable() {
    setPending(true);
    setError(null);
    try {
      const response = await authedFetch("/api/devices/push-token", { method: "DELETE" });
      if (!response.ok) throw new Error("알림 끄기에 실패했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알림 끄기에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-neutral-600">
        {enabled
          ? "이 기기에서 기한 임박 및 사용 예정 알림을 받고 있습니다."
          : "기한 임박, 사용 예정 알림을 이 기기로 받으려면 알림을 켜세요."}
      </p>
      {error ? <FieldError>{error}</FieldError> : null}
      {enabled ? (
        <Button type="button" variant="outline" onClick={handleDisable} disabled={pending}>
          {pending ? "처리 중..." : "이 기기 알림 끄기"}
        </Button>
      ) : (
        <Button type="button" onClick={handleEnable} disabled={pending}>
          {pending ? "처리 중..." : "알림 켜기"}
        </Button>
      )}
    </div>
  );
}
