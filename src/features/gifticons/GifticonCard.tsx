"use client";

import { useState } from "react";
import Link from "next/link";
import { useStorageUrl } from "@/lib/firebase/useStorageUrl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMembers } from "@/features/members/useMembers";
import { PlanModal } from "./PlanModal";
import { UseModal } from "./UseModal";
import { STATUS_BADGE_TONE, formatDDayLabel, formatPlannedLabel } from "./statusDisplay";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/types/domain";
import type { Gifticon } from "@/types/domain";

export function GifticonCard({ gifticon }: { gifticon: Gifticon }) {
  const thumbnailUrl = useStorageUrl(gifticon.thumbnailPath);
  const { members } = useMembers();
  const [modal, setModal] = useState<"plan" | "use" | null>(null);

  const plannedMember = members.find((m) => m.id === gifticon.plannedMemberId);
  const plannedLabel = formatPlannedLabel(plannedMember?.name ?? null, gifticon.plannedAt);

  return (
    <div className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <Link
        href={`/gifticons/${gifticon.id}`}
        className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100"
        aria-label="상세 보기"
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Firebase Storage download URL, not a local/static asset
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link href={`/gifticons/${gifticon.id}`} className="min-w-0">
          <p className="truncate text-sm text-neutral-500">{gifticon.brand ?? "브랜드 미확인"}</p>
          <p className="truncate font-semibold text-neutral-900">{gifticon.productName ?? "상품명 확인 필요"}</p>
        </Link>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={STATUS_BADGE_TONE[gifticon.status]}>{STATUS_LABELS[gifticon.status]}</Badge>
          <Badge tone="neutral">{CATEGORY_LABELS[gifticon.category]}</Badge>
          {gifticon.status !== "used" ? (
            <span className="text-xs font-medium text-neutral-500">{formatDDayLabel(gifticon.expirationDate)}</span>
          ) : null}
        </div>

        {plannedLabel ? <p className="text-xs text-brand-700">{plannedLabel}</p> : null}

        {gifticon.status !== "used" ? (
          <div className="mt-1 flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setModal("plan")}>
              사용 예정
            </Button>
            <Button type="button" size="sm" onClick={() => setModal("use")}>
              사용 완료
            </Button>
          </div>
        ) : null}
      </div>

      {modal === "plan" ? <PlanModal gifticon={gifticon} onClose={() => setModal(null)} /> : null}
      {modal === "use" ? (
        <UseModal gifticon={gifticon} onClose={() => setModal(null)} onUsed={() => setModal(null)} />
      ) : null}
    </div>
  );
}
