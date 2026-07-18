"use client";

import { useAuthGuard } from "@/features/auth/useAuthGuard";
import { AppShell } from "@/components/AppShell";
import { AddGifticonFlow } from "@/features/gifticons/AddGifticonFlow";
import { FullScreenSpinner } from "@/components/ui/spinner";

export default function NewGifticonPage() {
  const status = useAuthGuard("profile-complete");
  if (status !== "ready") return <FullScreenSpinner />;

  return (
    <AppShell hideAddButton>
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        <h1 className="text-xl font-bold text-neutral-900">기프티콘 추가</h1>
        <AddGifticonFlow />
      </div>
    </AppShell>
  );
}
