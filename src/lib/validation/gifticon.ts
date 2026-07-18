import { z } from "zod";
import { isValidDateString } from "@/lib/dates/kst";
import { gifticonAnalysisSchema } from "@/lib/gemini/schema";

const dateStringSchema = z
  .string()
  .refine(isValidDateString, { message: "유효한 날짜 형식(YYYY-MM-DD)이 아닙니다." });

const CATEGORY_VALUES = [
  "cafe",
  "convenience_store",
  "bakery",
  "restaurant",
  "delivery_food",
  "dessert",
  "cinema_culture",
  "shopping",
  "other",
  "unknown",
] as const;

/**
 * One shape for both the AI-assisted and fully-manual registration paths:
 * by the time the user hits "등록 완료" on the result/edit screen, whatever
 * is in the form is the confirmed value (PRD 5.5 — the result screen *is*
 * the correction step). `ai` carries the original Gemini output for
 * display/audit only; it never overrides what the user submitted.
 */
export const saveGifticonSchema = z.object({
  imagePath: z.string().min(1),
  thumbnailPath: z.string().min(1).nullable(),
  imageHash: z.string().min(1).nullable(),
  brand: z.string().trim().min(1).max(60).nullable(),
  productName: z.string().trim().min(1).max(120).nullable(),
  category: z.enum(CATEGORY_VALUES),
  faceValue: z.number().nonnegative().nullable(),
  quantity: z.number().int().positive().nullable(),
  expirationDate: dateStringSchema.nullable(),
  memo: z.string().trim().max(500).nullable(),
  ai: z
    .object({
      model: z.string(),
      confidence: gifticonAnalysisSchema.shape.confidence,
      warnings: z.array(z.string()),
      expirationRawText: z.string().nullable(),
      expirationType: gifticonAnalysisSchema.shape.expirationType,
    })
    .nullable(),
});

export type SaveGifticonInput = z.infer<typeof saveGifticonSchema>;

export const updateGifticonSchema = z.object({
  brand: z.string().trim().min(1).max(60).nullable().optional(),
  productName: z.string().trim().min(1).max(120).nullable().optional(),
  category: z.enum(CATEGORY_VALUES).optional(),
  faceValue: z.number().nonnegative().nullable().optional(),
  quantity: z.number().int().positive().nullable().optional(),
  expirationDate: dateStringSchema.nullable().optional(),
  memo: z.string().trim().max(500).nullable().optional(),
  /** Manual "확인 완료" toggle — clears the needs_review bucket without changing the underlying data. */
  needsReview: z.boolean().optional(),
  /**
   * PRD 14 "동시 수정": the `updatedAt` the client last saw. If the stored
   * value has since moved on, the write is rejected as a 409 instead of
   * silently overwriting a concurrent edit from another family member's
   * device.
   */
  expectedUpdatedAt: z.string().optional(),
});

export type UpdateGifticonInput = z.infer<typeof updateGifticonSchema>;
