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
import { useGifticons } from "@/features/gifticons/useGifticons";
import { useGifticonFilters } from "@/features/gifticons/useGifticonFilters";
import { useMembers } from "@/features/members/useMembers";
import { applyGifticonFilters, sortGifticons } from "@/features/gifticons/filters";
import { DashboardBanners } from "@/features/gifticons/DashboardBanners";
import { SummaryCards } from "@/features/gifticons/SummaryCards";
import { FilterBar } from "@/features/gifticons/FilterBar";
import { GifticonCard } from "@/features/gifticons/GifticonCard";

export default function DashboardPage() {
  const status = useAuthGuard("profile-complete");
  const { member } = useAuth();
  const { gifticons, loading } = useGifticons();
  const { members } = useMembers();
  const { filters, update } = useGifticonFilters();

  if (status !== "ready") return <FullScreenSpinner />;

  const filtered = applyGifticonFilters(gifticons, filters, members);
  // PRD 5.6: 사용 완료 항목은 기본 목록에서 제외 — unless the user explicitly asks to see them via the status filter.
  const visible = filters.status === "used" ? filtered : filtered.filter((g) => g.status !== "used");
  const sorted = sortGifticons(visible, filters.sort);

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-neutral-900">
            {member?.avatarEmoji} {member?.name}님, 안녕하세요
          </h1>
          <Link href="/gifticons/new" className={cn(buttonVariants({ size: "md" }), "hidden md:inline-flex")}>
            <Plus className="h-4 w-4" />
            추가
          </Link>
        </div>

        {!loading && gifticons.length === 0 ? (
          <Card>
            <CardTitle>기프티콘 등록</CardTitle>
            <CardDescription>이미지를 업로드하면 AI가 브랜드·상품명·유효기간을 자동으로 채워줍니다.</CardDescription>
            <Link href="/gifticons/new" className={cn(buttonVariants({ size: "md" }), "mt-4")}>
              <Plus className="h-4 w-4" />
              기프티콘 추가
            </Link>
          </Card>
        ) : (
          <>
            <DashboardBanners gifticons={gifticons} />
            <SummaryCards gifticons={gifticons} onSelect={update} />
            <FilterBar filters={filters} onChange={update} gifticons={gifticons} />

            <div className="flex flex-col gap-2">
              {sorted.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">조건에 맞는 기프티콘이 없습니다.</p>
              ) : (
                sorted.map((gifticon) => <GifticonCard key={gifticon.id} gifticon={gifticon} />)
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
