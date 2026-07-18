"use client";

import { BANNER_LABELS, getDashboardBanners, type DashboardBannerType } from "./sort";
import type { Gifticon } from "@/types/domain";

const BANNER_STYLES: Record<DashboardBannerType, string> = {
  expired: "bg-red-50 text-red-700 border-red-200",
  today: "bg-red-50 text-red-700 border-red-200",
  d1: "bg-amber-50 text-amber-800 border-amber-200",
  d3: "bg-amber-50 text-amber-800 border-amber-200",
  d7: "bg-blue-50 text-blue-700 border-blue-200",
  needs_review: "bg-neutral-100 text-neutral-700 border-neutral-200",
  plan_upcoming: "bg-brand-50 text-brand-700 border-brand-100",
};

/** PRD 5.6: this area shouldn't reserve space when there's nothing urgent — parent should render null-safely (this returns null itself when empty). */
export function DashboardBanners({ gifticons }: { gifticons: Gifticon[] }) {
  const banners = getDashboardBanners(gifticons);
  if (banners.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {banners.map((banner) => (
        <div
          key={banner.type}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${BANNER_STYLES[banner.type]}`}
        >
          {BANNER_LABELS[banner.type]} {banner.count}개
        </div>
      ))}
    </div>
  );
}
