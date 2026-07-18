import { z } from "zod";
import { isValidDateString } from "@/lib/dates/kst";

export const planGifticonSchema = z.object({
  memberId: z.string().min(1),
  plannedDate: z.string().refine(isValidDateString, { message: "유효한 날짜(YYYY-MM-DD)가 아닙니다." }),
  plannedTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  plannedNote: z.string().trim().max(200).nullable().optional(),
});
export type PlanGifticonInput = z.infer<typeof planGifticonSchema>;

export const useGifticonSchema = z.object({
  memberId: z.string().min(1),
  usedAt: z.string().datetime().optional(),
  usedNote: z.string().trim().max(200).nullable().optional(),
});
export type UseGifticonInput = z.infer<typeof useGifticonSchema>;
