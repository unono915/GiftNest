"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuthGuard } from "@/features/auth/useAuthGuard";
import { useAuth } from "@/features/auth/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { FullScreenSpinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const status = useAuthGuard("profile-complete");
  const { member } = useAuth();

  if (status !== "ready") return <FullScreenSpinner />;

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              {member?.avatarEmoji} {member?.name}님, 안녕하세요
            </h1>
            <p className="mt-1 text-sm text-neutral-500">아직 등록된 기프티콘이 없습니다.</p>
          </div>
          <Link href="/gifticons/new" className={cn(buttonVariants({ size: "md" }), "hidden md:inline-flex")}>
            <Plus className="h-4 w-4" />
            추가
          </Link>
        </div>

        <Card>
          <CardTitle>기프티콘 등록</CardTitle>
          <CardDescription>
            이미지를 업로드하면 AI가 브랜드·상품명·유효기간을 자동으로 채워줍니다.
          </CardDescription>
          <Link href="/gifticons/new" className={cn(buttonVariants({ size: "md" }), "mt-4")}>
            <Plus className="h-4 w-4" />
            기프티콘 추가
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}
