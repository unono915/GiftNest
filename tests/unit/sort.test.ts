import { describe, expect, it } from "vitest";
import { getDashboardBanners, sortGifticonsForDashboard } from "@/features/gifticons/sort";
import type { Gifticon } from "@/types/domain";

function makeGifticon(overrides: Partial<Gifticon>): Gifticon {
  return {
    id: overrides.id ?? Math.random().toString(36),
    familyId: "",
    imagePath: "x",
    thumbnailPath: null,
    imageHash: null,
    brand: "브랜드",
    normalizedBrand: "브랜드",
    productName: "상품",
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

describe("sortGifticonsForDashboard", () => {
  it("excludes used items", () => {
    const items = [makeGifticon({ id: "a", status: "used" }), makeGifticon({ id: "b", status: "available" })];
    const sorted = sortGifticonsForDashboard(items);
    expect(sorted.map((g) => g.id)).toEqual(["b"]);
  });

  it("sorts by nearest expiration date first", () => {
    const items = [
      makeGifticon({ id: "far", expirationDate: "2026-12-31" }),
      makeGifticon({ id: "near", expirationDate: "2026-08-01" }),
    ];
    const sorted = sortGifticonsForDashboard(items);
    expect(sorted.map((g) => g.id)).toEqual(["near", "far"]);
  });

  it("puts items with no expiration date last", () => {
    const items = [
      makeGifticon({ id: "no-date", expirationDate: null }),
      makeGifticon({ id: "dated", expirationDate: "2026-08-01" }),
    ];
    const sorted = sortGifticonsForDashboard(items);
    expect(sorted.map((g) => g.id)).toEqual(["dated", "no-date"]);
  });
});

describe("getDashboardBanners", () => {
  const today = "2026-07-18";

  it("buckets by expiry proximity in PRD priority order", () => {
    const items = [
      makeGifticon({ id: "expired", expirationDate: "2026-07-01" }),
      makeGifticon({ id: "today", expirationDate: "2026-07-18" }),
      makeGifticon({ id: "d7", expirationDate: "2026-07-25" }),
    ];
    const banners = getDashboardBanners(items, today);
    expect(banners.map((b) => b.type)).toEqual(["expired", "today", "d7"]);
  });

  it("omits empty buckets entirely", () => {
    const items = [makeGifticon({ id: "a", expirationDate: "2026-12-31" })];
    const banners = getDashboardBanners(items, today);
    expect(banners).toEqual([]);
  });

  it("counts needs_review items separately from expiry buckets", () => {
    const items = [
      makeGifticon({ id: "a", needsReview: true, expirationDate: null }),
      makeGifticon({ id: "b", needsReview: true, expirationDate: null }),
    ];
    const banners = getDashboardBanners(items, today);
    expect(banners).toEqual([{ type: "needs_review", count: 2 }]);
  });

  it("excludes used and archived items from every bucket", () => {
    const items = [
      makeGifticon({ id: "a", status: "used", expirationDate: "2026-07-18" }),
      makeGifticon({ id: "b", status: "archived", expirationDate: "2026-07-18" }),
    ];
    expect(getDashboardBanners(items, today)).toEqual([]);
  });
});
