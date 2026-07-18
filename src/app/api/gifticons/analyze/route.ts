import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/verifyRequest";
import { handleApiError, ApiError } from "@/server/http";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_ANALYSIS_IMAGE_BYTES, isAllowedImageMimeType } from "@/lib/validation/image";
import { analyzeGifticonImage, GeminiAnalysisError } from "@/lib/gemini/client";
import { evaluateAnalysis } from "@/lib/gemini/confidence";
import { normalizeBrand } from "@/lib/gemini/normalize";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const form = await request.formData().catch(() => null);
    const file = form?.get("image");
    if (!file || !(file instanceof File)) {
      throw new ApiError(400, "이미지 파일이 필요합니다.");
    }
    if (!isAllowedImageMimeType(file.type)) {
      throw new ApiError(
        400,
        `지원하지 않는 이미지 형식입니다. (${ALLOWED_IMAGE_MIME_TYPES.join(", ")}만 지원)`
      );
    }
    if (file.size > MAX_ANALYSIS_IMAGE_BYTES) {
      throw new ApiError(400, "이미지 파일이 너무 큽니다.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    let analysis;
    try {
      analysis = await analyzeGifticonImage(base64, file.type);
    } catch (error) {
      if (error instanceof GeminiAnalysisError) {
        // Never leak the raw model response or internal cause to the client (PRD 5.4).
        return NextResponse.json(
          {
            success: false,
            error: "이미지에서 유효기간을 확인하지 못했습니다. 날짜를 직접 입력해 주세요.",
            requiresManualEntry: true,
          },
          { status: 502 }
        );
      }
      throw error;
    }

    const reviewOutcome = evaluateAnalysis(analysis);

    return NextResponse.json({
      success: true,
      analysis: { ...analysis, brand: normalizeBrand(analysis.brand) ?? analysis.brand },
      normalizedBrand: normalizeBrand(analysis.brand),
      reviewOutcome,
      model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
