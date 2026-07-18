import { describe, expect, it } from "vitest";
import { normalizeBrand, coerceCategory } from "@/lib/gemini/normalize";
import { evaluateAnalysis } from "@/lib/gemini/confidence";
import type { GifticonAnalysis } from "@/lib/gemini/schema";

describe("normalizeBrand", () => {
  it("strips a trailing corporate suffix", () => {
    expect(normalizeBrand("스타벅스커피코리아")).toBe("스타벅스커피");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeBrand("투썸   플레이스")).toBe("투썸 플레이스");
  });

  it("returns null for null input", () => {
    expect(normalizeBrand(null)).toBeNull();
  });
});

describe("coerceCategory", () => {
  it("passes through a known category", () => {
    expect(coerceCategory("cafe")).toBe("cafe");
  });

  it("falls back to unknown for an unexpected value", () => {
    expect(coerceCategory("not_a_real_category")).toBe("unknown");
  });
});

function baseAnalysis(overrides: Partial<GifticonAnalysis> = {}): GifticonAnalysis {
  return {
    isGifticon: true,
    brand: "스타벅스",
    productName: "아메리카노",
    category: "cafe",
    faceValue: null,
    quantity: 1,
    expirationDate: "2026-12-31",
    expirationRawText: "2026.12.31까지",
    expirationType: "usage_deadline",
    warnings: [],
    confidence: { overall: 0.97, brand: 0.99, productName: 0.95, category: 0.98, expirationDate: 0.99 },
    ...overrides,
  };
}

describe("evaluateAnalysis", () => {
  it("auto-registers when expiration confidence is high (>= 0.85)", () => {
    const result = evaluateAnalysis(baseAnalysis());
    expect(result.needsReview).toBe(false);
    expect(result.dateNeedsConfirmation).toBe(false);
    expect(result.requiresManualConfirmation).toBe(false);
  });

  it("flags 'date needs confirmation' in the 0.60-0.85 band but does not need_review", () => {
    const result = evaluateAnalysis(
      baseAnalysis({ confidence: { overall: 0.9, brand: 0.9, productName: 0.9, category: 0.9, expirationDate: 0.7 } })
    );
    expect(result.needsReview).toBe(false);
    expect(result.dateNeedsConfirmation).toBe(true);
  });

  it("moves to needs_review when expiration confidence is below 0.60", () => {
    const result = evaluateAnalysis(
      baseAnalysis({ confidence: { overall: 0.9, brand: 0.9, productName: 0.9, category: 0.9, expirationDate: 0.4 } })
    );
    expect(result.needsReview).toBe(true);
    expect(result.reviewReasons).toContain("유효기간 인식 신뢰도가 낮습니다.");
  });

  it("moves to needs_review when expiration date is null regardless of confidence value", () => {
    const result = evaluateAnalysis(
      baseAnalysis({ expirationDate: null, confidence: { overall: 0.9, brand: 0.9, productName: 0.9, category: 0.9, expirationDate: 0 } })
    );
    expect(result.needsReview).toBe(true);
    expect(result.reviewReasons).toContain("유효기간을 이미지에서 확인하지 못했습니다.");
  });

  it("requires manual confirmation before saving when overall confidence is below 0.60", () => {
    const result = evaluateAnalysis(
      baseAnalysis({ confidence: { overall: 0.5, brand: 0.5, productName: 0.5, category: 0.5, expirationDate: 0.9 } })
    );
    expect(result.requiresManualConfirmation).toBe(true);
  });

  it("adds reasons for missing brand/product name", () => {
    const result = evaluateAnalysis(baseAnalysis({ brand: null, productName: null }));
    expect(result.reviewReasons).toContain("브랜드를 확인하지 못했습니다.");
    expect(result.reviewReasons).toContain("상품명을 확인하지 못했습니다.");
  });
});
