import "server-only";
import { GoogleGenAI } from "@google/genai";
import { gifticonAnalysisSchema, geminiResponseSchema, type GifticonAnalysis } from "./schema";
import { GIFTICON_SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

export class GeminiAnalysisError extends Error {
  constructor(
    message: string,
    readonly cause2?: unknown
  ) {
    super(message);
    this.name = "GeminiAnalysisError";
  }
}

let cachedClient: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiAnalysisError("GEMINI_API_KEY가 설정되지 않았습니다.");
  }
  if (!cachedClient) cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

function getModelId(): string {
  return process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
}

async function callGemini(imageBase64: string, mimeType: string): Promise<GifticonAnalysis> {
  const response = await getClient().models.generateContent({
    model: getModelId(),
    contents: [
      {
        role: "user",
        parts: [{ text: buildUserPrompt() }, { inlineData: { mimeType, data: imageBase64 } }],
      },
    ],
    config: {
      systemInstruction: GIFTICON_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: geminiResponseSchema,
      temperature: 0,
    },
  });

  const text = response.text;
  if (!text) {
    throw new GeminiAnalysisError("Gemini가 빈 응답을 반환했습니다.");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch (error) {
    // Never surface the raw model response to logs/clients (PRD 5.4 —
    // no full AI response in logs, and only a user-safe message client-side).
    throw new GeminiAnalysisError("Gemini 응답을 JSON으로 해석하지 못했습니다.", error);
  }

  const parsed = gifticonAnalysisSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new GeminiAnalysisError("Gemini 응답이 예상한 스키마와 일치하지 않습니다.", parsed.error);
  }

  return parsed.data;
}

/**
 * PRD 5.4: Gemini 호출 실패 시 1회만 자동 재시도한다.
 */
export async function analyzeGifticonImage(imageBase64: string, mimeType: string): Promise<GifticonAnalysis> {
  try {
    return await callGemini(imageBase64, mimeType);
  } catch (firstError) {
    console.error("[gemini] first attempt failed", firstError instanceof Error ? firstError.message : firstError);
    try {
      return await callGemini(imageBase64, mimeType);
    } catch (secondError) {
      console.error(
        "[gemini] retry failed",
        secondError instanceof Error ? secondError.message : secondError
      );
      throw new GeminiAnalysisError("이미지 분석에 실패했습니다.", secondError);
    }
  }
}
