import { daysUntil, todayKst } from "@/lib/dates/kst";
import type { GifticonStatus } from "@/types/domain";
import type { BadgeProps } from "@/components/ui/badge";

/** PRD 13 "상태 표현" — color is never the only signal, every status also gets distinct text. */
export const STATUS_BADGE_TONE: Record<GifticonStatus, NonNullable<BadgeProps["tone"]>> = {
  available: "success",
  planned: "brand",
  used: "neutral",
  expired: "danger",
  needs_review: "warning",
  archived: "neutral",
};

export function formatDDayLabel(expirationDate: string | null, today: string = todayKst()): string {
  if (!expirationDate) return "날짜 확인 필요";
  const diff = daysUntil(expirationDate, today);
  if (diff < 0) return "기한 만료";
  if (diff === 0) return "오늘 마감";
  return `${diff}일 남음`;
}

export function formatPlannedLabel(plannedMemberName: string | null, plannedAt: string | null): string | null {
  if (!plannedMemberName || !plannedAt) return null;
  const date = plannedAt.slice(5, 10).replace("-", "월 ") + "일";
  return `${plannedMemberName} 사용 예정 · ${date}`;
}

export function formatUsedLabel(usedMemberName: string | null): string | null {
  if (!usedMemberName) return null;
  return `${usedMemberName} 사용 완료`;
}
