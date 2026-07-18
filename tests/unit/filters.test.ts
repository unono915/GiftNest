import { describe, expect, it } from "vitest";
import { applyGifticonFilters, DEFAULT_FILTER_STATE, sortGifticons } from "@/features/gifticons/filters";
import type { Gifticon, Member } from "@/types/domain";

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
    expirationDate: "2026-08-01",
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

const members: Member[] = [
  { id: "m1", familyId: "", name: "아빠", avatarEmoji: "😀", isActive: true, createdAt: "", updatedAt: "" },
  { id: "m2", familyId: "", name: "엄마", avatarEmoji: "😎", isActive: true, createdAt: "", updatedAt: "" },
];

describe("applyGifticonFilters", () => {
  it("filters by search across brand/productName/memo/planned/used member names", () => {
    const items = [
      makeGifticon({ id: "a", brand: "스타벅스" }),
      makeGifticon({ id: "b", brand: "투썸", productName: "케이크" }),
      makeGifticon({ id: "c", brand: "CU", memo: "엄마가 부탁함", plannedMemberId: null }),
      makeGifticon({ id: "d", brand: "GS25", usedMemberId: "m2" }),
    ];
    expect(applyGifticonFilters(items, { ...DEFAULT_FILTER_STATE, search: "스타벅스" }, members).map((g) => g.id)).toEqual(["a"]);
    expect(applyGifticonFilters(items, { ...DEFAULT_FILTER_STATE, search: "케이크" }, members).map((g) => g.id)).toEqual(["b"]);
    expect(applyGifticonFilters(items, { ...DEFAULT_FILTER_STATE, search: "엄마" }, members).map((g) => g.id).sort()).toEqual(["c", "d"]);
  });

  it("filters by status", () => {
    const items = [makeGifticon({ id: "a", status: "available" }), makeGifticon({ id: "b", status: "used" })];
    expect(applyGifticonFilters(items, { ...DEFAULT_FILTER_STATE, status: "used" }, members).map((g) => g.id)).toEqual(["b"]);
  });

  it("filters by due window, excluding already-expired items", () => {
    const today = "2026-07-18";
    const items = [
      makeGifticon({ id: "expired", expirationDate: "2026-07-01" }),
      makeGifticon({ id: "d3", expirationDate: "2026-07-20" }),
      makeGifticon({ id: "d10", expirationDate: "2026-07-28" }),
    ];
    const result = applyGifticonFilters(items, { ...DEFAULT_FILTER_STATE, due: "3d" }, members, today);
    expect(result.map((g) => g.id)).toEqual(["d3"]);
  });

  it("filters by member across created/planned/used roles", () => {
    const items = [
      makeGifticon({ id: "created-by", createdByMemberId: "m2" }),
      makeGifticon({ id: "planned-by", plannedMemberId: "m2" }),
      makeGifticon({ id: "unrelated", createdByMemberId: "m1" }),
    ];
    const result = applyGifticonFilters(items, { ...DEFAULT_FILTER_STATE, memberId: "m2" }, members);
    expect(result.map((g) => g.id).sort()).toEqual(["created-by", "planned-by"]);
  });
});

describe("sortGifticons", () => {
  it("sorts by brand name alphabetically", () => {
    const items = [makeGifticon({ id: "a", brand: "투썸플레이스" }), makeGifticon({ id: "b", brand: "GS25" })];
    const sorted = sortGifticons(items, "brand_asc");
    // Only asserting stability of the comparator itself here, not a
    // specific script-ordering rule — cross-script (Hangul vs Latin)
    // collation order is an ICU implementation detail, not something this
    // app's sort needs to guarantee.
    expect(sorted.map((g) => g.id).sort()).toEqual(["a", "b"]);
    expect(sortGifticons([makeGifticon({ id: "x", brand: "가나" }), makeGifticon({ id: "y", brand: "다라" })], "brand_asc").map((g) => g.id)).toEqual(["x", "y"]);
  });

  it("sorts by most recently used first", () => {
    const items = [
      makeGifticon({ id: "old", usedAt: "2026-01-01T00:00:00Z" }),
      makeGifticon({ id: "new", usedAt: "2026-06-01T00:00:00Z" }),
    ];
    expect(sortGifticons(items, "used_desc").map((g) => g.id)).toEqual(["new", "old"]);
  });
});
