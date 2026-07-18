import type { GifticonAnalysis } from "./schema";

/** PRD 5.4 "신뢰도 처리" — thresholds are env-configurable per the PRD's own instruction. */
export const CONFIDENCE_THRESHOLDS = {
  expirationAuto: Number(process.env.CONFIDENCE_EXPIRATION_AUTO ?? 0.85),
  expirationReview: Number(process.env.CONFIDENCE_EXPIRATION_REVIEW ?? 0.6),
  overallConfirm: Number(process.env.CONFIDENCE_OVERALL_CONFIRM ?? 0.6),
};

export type ReviewOutcome = {
  /** Goes into Gifticon.needsReview / the "확인 필요" bucket. */
  needsReview: boolean;
  reviewReasons: string[];
  /** Overall confidence too low — show a confirmation screen before saving, per PRD, rather than auto-saving silently. */
  requiresManualConfirmation: boolean;
  /** Date confidence is in the 0.60–0.85 band: saved, but flagged for the user to double check. */
  dateNeedsConfirmation: boolean;
};

export function evaluateAnalysis(analysis: GifticonAnalysis): ReviewOutcome {
  const reasons: string[] = [];
  const dateConfidence = analysis.confidence.expirationDate;

  const dateMissing = analysis.expirationDate === null;
  const dateConfidenceLow = dateConfidence < CONFIDENCE_THRESHOLDS.expirationReview;
  const dateConfidenceMedium =
    !dateMissing &&
    dateConfidence >= CONFIDENCE_THRESHOLDS.expirationReview &&
    dateConfidence < CONFIDENCE_THRESHOLDS.expirationAuto;

  if (dateMissing) reasons.push("유효기간을 이미지에서 확인하지 못했습니다.");
  if (!dateMissing && dateConfidenceLow) reasons.push("유효기간 인식 신뢰도가 낮습니다.");
  if (dateConfidenceMedium) reasons.push("유효기간 날짜를 다시 확인해 주세요.");
  if (!analysis.productName) reasons.push("상품명을 확인하지 못했습니다.");
  if (!analysis.brand) reasons.push("브랜드를 확인하지 못했습니다.");

  const needsReview = dateMissing || dateConfidenceLow;
  const requiresManualConfirmation = analysis.confidence.overall < CONFIDENCE_THRESHOLDS.overallConfirm;

  return {
    needsReview,
    reviewReasons: reasons,
    requiresManualConfirmation,
    dateNeedsConfirmation: dateConfidenceMedium,
  };
}
