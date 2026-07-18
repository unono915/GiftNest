import { authedFetch, authedJson } from "@/lib/api/client";
import type { GifticonAnalysis } from "@/lib/gemini/schema";
import type { ReviewOutcome } from "@/lib/gemini/confidence";
import type { Gifticon } from "@/types/domain";
import type { SaveGifticonInput, UpdateGifticonInput } from "@/lib/validation/gifticon";
import type { PlanGifticonInput, UseGifticonInput } from "@/lib/validation/gifticonActions";

export type AnalyzeResult =
  | { success: true; analysis: GifticonAnalysis; reviewOutcome: ReviewOutcome; model: string }
  | { success: false; error: string; requiresManualEntry: boolean };

export async function analyzeGifticonImage(imageBlob: Blob): Promise<AnalyzeResult> {
  const formData = new FormData();
  formData.append("image", imageBlob, "analysis.jpg");

  const response = await authedFetch("/api/gifticons/analyze", { method: "POST", body: formData });
  const data = await response.json();

  if (!response.ok || !data.success) {
    return {
      success: false,
      error: data.error ?? "이미지 분석에 실패했습니다.",
      requiresManualEntry: Boolean(data.requiresManualEntry),
    };
  }
  return { success: true, analysis: data.analysis, reviewOutcome: data.reviewOutcome, model: data.model };
}

export async function saveGifticon(
  input: SaveGifticonInput
): Promise<{ gifticon: Gifticon; duplicateWarning: boolean }> {
  return authedJson("/api/gifticons", { method: "POST", body: JSON.stringify(input) });
}

export async function updateGifticon(id: string, patch: UpdateGifticonInput): Promise<{ gifticon: Gifticon }> {
  return authedJson(`/api/gifticons/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function deleteGifticon(id: string): Promise<void> {
  await authedJson(`/api/gifticons/${id}`, { method: "DELETE" });
}

export async function planGifticon(id: string, input: PlanGifticonInput): Promise<{ gifticon: Gifticon }> {
  return authedJson(`/api/gifticons/${id}/plan`, { method: "POST", body: JSON.stringify(input) });
}

export async function clearGifticonPlan(id: string): Promise<{ gifticon: Gifticon }> {
  return authedJson(`/api/gifticons/${id}/plan`, { method: "DELETE" });
}

export async function markGifticonUsed(id: string, input: UseGifticonInput): Promise<{ gifticon: Gifticon }> {
  return authedJson(`/api/gifticons/${id}/use`, { method: "POST", body: JSON.stringify(input) });
}

export async function restoreGifticonUse(id: string): Promise<{ gifticon: Gifticon }> {
  return authedJson(`/api/gifticons/${id}/restore`, { method: "POST" });
}
