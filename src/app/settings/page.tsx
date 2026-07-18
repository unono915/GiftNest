"use client";

import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/features/auth/useAuthGuard";
import { useAuth } from "@/features/auth/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FullScreenSpinner } from "@/components/ui/spinner";
import { MemberManagement } from "@/features/members/MemberManagement";
import { ChangePinForm } from "@/features/settings/ChangePinForm";
import { NotificationSettings } from "@/features/settings/NotificationSettings";
import { InstallPrompt } from "@/features/pwa/InstallPrompt";

export default function SettingsPage() {
  const status = useAuthGuard("profile-complete");
  const { member, device, signOutDevice } = useAuth();
  const router = useRouter();

  if (status !== "ready") return <FullScreenSpinner />;

  async function handleLogout() {
    await signOutDevice();
    router.replace("/auth");
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-neutral-900">설정</h1>

        <Card>
          <CardTitle>현재 사용자</CardTitle>
          <CardDescription>
            {member?.avatarEmoji} {member?.name} · {device?.name}
          </CardDescription>
        </Card>

        <Card>
          <CardTitle>가족 구성원 관리</CardTitle>
          <CardDescription>구성원을 추가하거나 비활성화할 수 있습니다.</CardDescription>
          <div className="mt-4">
            <MemberManagement />
          </div>
        </Card>

        <Card>
          <CardTitle>공용 비밀번호 변경</CardTitle>
          <CardDescription>현재 비밀번호 확인 후 변경됩니다.</CardDescription>
          <div className="mt-4">
            <ChangePinForm />
          </div>
        </Card>

        <Card>
          <CardTitle>알림</CardTitle>
          <CardDescription>매일 오전 9시 기한 임박 및 사용 예정 알림을 보냅니다.</CardDescription>
          <div className="mt-4">
            <NotificationSettings />
          </div>
        </Card>

        <Card>
          <CardTitle>홈 화면에 설치</CardTitle>
          <CardDescription>앱처럼 빠르게 열 수 있도록 홈 화면에 추가하세요.</CardDescription>
          <div className="mt-4">
            <InstallPrompt />
          </div>
        </Card>

        <Card>
          <CardTitle>이 기기</CardTitle>
          <CardDescription>이 브라우저의 로그인 상태를 초기화합니다.</CardDescription>
          <Button variant="danger" className="mt-4" onClick={handleLogout}>
            이 기기 로그아웃
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
