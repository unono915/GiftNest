import { getExpiryBucket, todayKst, type ExpiryBucket } from "@/lib/dates/kst";
import type { Gifticon } from "@/types/domain";

/**
 * PRD 5.6 기본 정렬: 사용 가능한(=미사용) 항목을 유효기간 임박순으로,
 * 날짜 없는 항목은 뒤로, 사용 완료 항목은 기본 목록에서 제외.
 */
export function sortGifticonsForDashboard(gifticons: Gifticon[]): Gifticon[] {
  return gifticons
    .filter((g) => g.status !== "used")
    .slice()
    .sort((a, b) => {
      if (a.expirationDate === null && b.expirationDate === null) return 0;
      if (a.expirationDate === null) return 1;
      if (b.expirationDate === null) return -1;
      return a.expirationDate.localeCompare(b.expirationDate);
    });
}

export type DashboardBannerType =
  | "expired"
  | "today"
  | "d1"
  | "d3"
  | "d7"
  | "needs_review"
  | "plan_upcoming";

export type DashboardBanner = {
  type: DashboardBannerType;
  count: number;
};

const BUCKET_TO_BANNER: Partial<Record<ExpiryBucket, DashboardBannerType>> = {
  expired: "expired",
  today: "today",
  d1: "d1",
  d3: "d3",
  d7: "d7",
};

/**
 * PRD 5.6 상단 고정 영역 — priority order is the array order itself; empty
 * buckets are simply omitted so the banner area doesn't reserve space it
 * doesn't need.
 */
export function getDashboardBanners(gifticons: Gifticon[], today: string = todayKst()): DashboardBanner[] {
  const counts: Record<DashboardBannerType, number> = {
    expired: 0,
    today: 0,
    d1: 0,
    d3: 0,
    d7: 0,
    needs_review: 0,
    plan_upcoming: 0,
  };

  for (const g of gifticons) {
    if (g.status === "used" || g.status === "archived") continue;

    if (g.needsReview) {
      counts.needs_review += 1;
    } else if (g.expirationDate) {
      const bucket = BUCKET_TO_BANNER[getExpiryBucket(g.expirationDate, today)];
      if (bucket) counts[bucket] += 1;
    }

    if (g.status === "planned" && g.plannedAt) {
      const plannedDate = g.plannedAt.slice(0, 10);
      const daysUntilPlan = getExpiryBucket(plannedDate, today);
      if (daysUntilPlan === "today" || daysUntilPlan === "d1") counts.plan_upcoming += 1;
    }
  }

  const order: DashboardBannerType[] = ["expired", "today", "d1", "d3", "d7", "needs_review", "plan_upcoming"];
  return order.filter((type) => counts[type] > 0).map((type) => ({ type, count: counts[type] }));
}

export const BANNER_LABELS: Record<DashboardBannerType, string> = {
  expired: "만료됨",
  today: "오늘 만료",
  d1: "내일 만료 (D-1)",
  d3: "3일 이내 만료 (D-3)",
  d7: "7일 이내 만료 (D-7)",
  needs_review: "날짜 확인 필요",
  plan_upcoming: "사용 예정 임박",
};
