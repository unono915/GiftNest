"use client";

import { useAuthGuard } from "@/features/auth/useAuthGuard";
import { useAuth } from "@/features/auth/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FullScreenSpinner } from "@/components/ui/spinner";

export default function DashboardPage() {
  const status = useAuthGuard("profile-complete");
  const { member } = useAuth();

  if (status !== "ready") return <FullScreenSpinner />;

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            {member?.avatarEmoji} {member?.name}님, 안녕하세요
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            아직 등록된 기프티콘이 없습니다.
          </p>
        </div>

        <Card>
          <CardTitle>기프티콘 등록</CardTitle>
          <CardDescription>
            이미지 업로드와 AI 자동 분석 기능은 다음 단계에서 이어서 구현됩니다.
          </CardDescription>
        </Card>
      </div>
    </AppShell>
  );
}
