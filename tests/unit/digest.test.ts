import { describe, expect, it } from "vitest";
import {
  buildExpiryDigestGroups,
  buildPlanReminders,
  composeExpiryDigestMessage,
  composePlanReminderMessage,
} from "@/lib/notifications/digest";
import type { Gifticon } from "@/types/domain";

function makeGifticon(overrides: Partial<Gifticon>): Gifticon {
  return {
    id: overrides.id ?? Math.random().toString(36),
    familyId: "",
    imagePath: "x",
    thumbnailPath: null,
    imageHash: null,
    brand: "스타벅스",
    normalizedBrand: "스타벅스",
    productName: "아메리카노",
    category: "cafe",
    faceValue: null,
    quantity: 1,
    expirationDate: null,
    expirationRawText: null,
    expirationType: "unknown",
    status: "available",
    needsReview: false,
    reviewReasons: [],
    aiModel: null,
    aiConfidence: { overall: null, brand: null, productName: null, category: null, expirationDate: null },
    aiWarnings: [],
    plannedMemberId: null,
    plannedAt: null,
    plannedNote: null,
    usedMemberId: null,
    usedAt: null,
    usedNote: null,
    memo: null,
    createdByMemberId: "m1",
    createdByDeviceId: "d1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    archivedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

const today = "2026-07-18";

describe("buildExpiryDigestGroups", () => {
  it("groups items at exact D-7/D-3/D-1/D-Day/expired offsets only", () => {
    const items = [
      makeGifticon({ id: "d7", expirationDate: "2026-07-25" }),
      makeGifticon({ id: "d3", expirationDate: "2026-07-21" }),
      makeGifticon({ id: "d1", expirationDate: "2026-07-19" }),
      makeGifticon({ id: "today", expirationDate: "2026-07-18" }),
      makeGifticon({ id: "expired-yesterday", expirationDate: "2026-07-17" }),
      makeGifticon({ id: "not-a-trigger-day", expirationDate: "2026-07-20" }), // D-2, not a trigger
      makeGifticon({ id: "expired-long-ago", expirationDate: "2026-07-01" }), // already past D-1 expired trigger
    ];
    const groups = buildExpiryDigestGroups(items, today);
    const byType = Object.fromEntries(groups.map((g) => [g.type, g.gifticons.map((x) => x.id)]));

    expect(byType.expiry_d7).toEqual(["d7"]);
    expect(byType.expiry_d3).toEqual(["d3"]);
    expect(byType.expiry_d1).toEqual(["d1"]);
    expect(byType.expiry_today).toEqual(["today"]);
    expect(byType.expired).toEqual(["expired-yesterday"]);
    expect(groups.some((g) => g.gifticons.some((x) => x.id === "not-a-trigger-day"))).toBe(false);
    expect(groups.some((g) => g.gifticons.some((x) => x.id === "expired-long-ago"))).toBe(false);
  });

  it("excludes used, archived, deleted, and dateless items", () => {
    const items = [
      makeGifticon({ id: "used", status: "used", expirationDate: "2026-07-18" }),
      makeGifticon({ id: "archived", status: "archived", expirationDate: "2026-07-18" }),
      makeGifticon({ id: "deleted", expirationDate: "2026-07-18", deletedAt: "2026-07-01T00:00:00Z" }),
      makeGifticon({ id: "no-date", expirationDate: null }),
    ];
    expect(buildExpiryDigestGroups(items, today)).toEqual([]);
  });
});

describe("buildPlanReminders", () => {
  it("fires the day-before reminder exactly one day ahead of the planned date", () => {
    const items = [
      makeGifticon({ id: "tomorrow", status: "planned", plannedAt: "2026-07-19T09:00:00+09:00" }),
      makeGifticon({ id: "today", status: "planned", plannedAt: "2026-07-18T09:00:00+09:00" }),
      makeGifticon({ id: "far", status: "planned", plannedAt: "2026-07-25T09:00:00+09:00" }),
    ];
    const reminders = buildPlanReminders(items, today);
    expect(reminders.map((r) => [r.gifticon.id, r.type])).toEqual([
      ["tomorrow", "plan_day_before"],
      ["today", "plan_today"],
    ]);
  });

  it("ignores non-planned items", () => {
    const items = [makeGifticon({ id: "a", status: "available", plannedAt: "2026-07-18T09:00:00+09:00" })];
    expect(buildPlanReminders(items, today)).toEqual([]);
  });
});

describe("composeExpiryDigestMessage", () => {
  it("names the item directly when there is exactly one", () => {
    const g = makeGifticon({ brand: "스타벅스", productName: "아메리카노", expirationDate: "2026-07-21" });
    const message = composeExpiryDigestMessage({ type: "expiry_d3", gifticons: [g] });
    expect(message.body).toBe("스타벅스 아메리카노의 사용 기한이 3일 남았습니다.");
  });

  it("aggregates by count when there are multiple, matching PRD's example wording", () => {
    const message = composeExpiryDigestMessage({
      type: "expiry_today",
      gifticons: [makeGifticon({}), makeGifticon({})],
    });
    expect(message.body).toBe("오늘까지 사용해야 하는 기프티콘이 2개 있습니다.");
  });

  it("never includes barcode/coupon fields (only brand + product name)", () => {
    const g = makeGifticon({ brand: "스타벅스", productName: "아메리카노" });
    const message = composeExpiryDigestMessage({ type: "expiry_d1", gifticons: [g] });
    expect(message.body).not.toMatch(/\d{4}\s*\d{4}\s*\d{4}/);
  });
});

describe("composePlanReminderMessage", () => {
  it("matches PRD's example wording for a day-before reminder", () => {
    const g = makeGifticon({ brand: "투썸", productName: "케이크" });
    const message = composePlanReminderMessage({ type: "plan_day_before", gifticon: g }, "엄마");
    expect(message.body).toBe("내일 엄마가 사용 예정인 투썸 케이크이(가) 있습니다.");
  });
});
