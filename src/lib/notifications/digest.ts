import { daysUntil, todayKst } from "@/lib/dates/kst";
import type { Gifticon, NotificationType } from "@/types/domain";

export type DigestGroup = {
  type: NotificationType;
  gifticons: Gifticon[];
};

const EXPIRY_TYPE_BY_DIFF: Record<number, NotificationType> = {
  7: "expiry_d7",
  3: "expiry_d3",
  1: "expiry_d1",
  0: "expiry_today",
  [-1]: "expired",
};

/**
 * PRD 5.11 정기 실행: exact single-day triggers (D-7, D-3, D-1, D-Day, and
 * the first day past due), not a rolling "within N days" window — each
 * threshold fires exactly once per gifticon by construction, since a given
 * expirationDate only ever produces one of these diffs relative to "today".
 * Intentionally distinct from getExpiryBucket() (dashboard banners), which
 * buckets ranges for display and would otherwise re-fire this daily.
 */
export function buildExpiryDigestGroups(gifticons: Gifticon[], today: string = todayKst()): DigestGroup[] {
  const byType = new Map<NotificationType, Gifticon[]>();

  for (const g of gifticons) {
    if (g.status === "used" || g.status === "archived" || g.deletedAt) continue;
    if (!g.expirationDate) continue;

    const diff = daysUntil(g.expirationDate, today);
    const type = EXPIRY_TYPE_BY_DIFF[diff];
    if (!type) continue;

    const list = byType.get(type) ?? [];
    list.push(g);
    byType.set(type, list);
  }

  return Array.from(byType.entries()).map(([type, items]) => ({ type, gifticons: items }));
}

export type PlanReminderItem = {
  type: "plan_day_before" | "plan_today";
  gifticon: Gifticon;
};

/** PRD 5.8 예정 알림: 예정일 전날 오전 9시, 예정 당일 오전 9시. */
export function buildPlanReminders(gifticons: Gifticon[], today: string = todayKst()): PlanReminderItem[] {
  const reminders: PlanReminderItem[] = [];

  for (const g of gifticons) {
    if (g.status !== "planned" || !g.plannedAt || g.deletedAt) continue;
    const plannedDate = g.plannedAt.slice(0, 10);
    const diff = daysUntil(plannedDate, today);
    if (diff === 1) reminders.push({ type: "plan_day_before", gifticon: g });
    else if (diff === 0) reminders.push({ type: "plan_today", gifticon: g });
  }

  return reminders;
}

const EXPIRY_DAY_LABEL: Partial<Record<NotificationType, string>> = {
  expiry_d7: "7일",
  expiry_d3: "3일",
  expiry_d1: "1일",
};

function itemLabel(g: Gifticon): string {
  return [g.brand, g.productName].filter(Boolean).join(" ") || "기프티콘";
}

/**
 * PRD 5.11 알림 문구 예시를 그대로 따른다: 단일 항목은 이름을 밝히고,
 * 여러 항목은 개수로 묶는다. 잠금 화면에 바코드/쿠폰 번호가 노출되지
 * 않도록 브랜드/상품명 외 필드는 절대 포함하지 않는다.
 */
export function composeExpiryDigestMessage(group: DigestGroup): { title: string; body: string } {
  const { type, gifticons } = group;
  const count = gifticons.length;

  if (type === "expiry_today") {
    return count === 1
      ? { title: "GiftNest", body: `${itemLabel(gifticons[0])}의 사용 기한이 오늘까지입니다.` }
      : { title: "GiftNest", body: `오늘까지 사용해야 하는 기프티콘이 ${count}개 있습니다.` };
  }
  if (type === "expired") {
    return count === 1
      ? { title: "GiftNest", body: `${itemLabel(gifticons[0])}의 사용 기한이 지났습니다.` }
      : { title: "GiftNest", body: `사용 기한이 지난 기프티콘이 ${count}개 있습니다.` };
  }

  const dayLabel = EXPIRY_DAY_LABEL[type] ?? "";
  return count === 1
    ? { title: "GiftNest", body: `${itemLabel(gifticons[0])}의 사용 기한이 ${dayLabel} 남았습니다.` }
    : { title: "GiftNest", body: `${dayLabel} 후 만료되는 기프티콘이 ${count}개 있습니다.` };
}

export function composePlanReminderMessage(
  reminder: PlanReminderItem,
  plannedMemberName: string | null
): { title: string; body: string } {
  const who = plannedMemberName ?? "가족";
  const when = reminder.type === "plan_day_before" ? "내일" : "오늘";
  return { title: "GiftNest", body: `${when} ${who}가 사용 예정인 ${itemLabel(reminder.gifticon)}이(가) 있습니다.` };
}
