import { Type, type Schema } from "@google/genai";
import { z } from "zod";

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

const EXPIRATION_TYPE_VALUES = ["usage_deadline", "exchange_deadline", "unknown"] as const;

export const gifticonAnalysisSchema = z.object({
  isGifticon: z.boolean(),
  brand: z.string().min(1).nullable(),
  productName: z.string().min(1).nullable(),
  category: z.enum(CATEGORY_VALUES),
  faceValue: z.number().nonnegative().nullable(),
  quantity: z.number().int().positive().nullable(),
  expirationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  expirationRawText: z.string().nullable(),
  expirationType: z.enum(EXPIRATION_TYPE_VALUES),
  warnings: z.array(z.string()),
  confidence: z.object({
    overall: z.number().min(0).max(1),
    brand: z.number().min(0).max(1),
    productName: z.number().min(0).max(1),
    category: z.number().min(0).max(1),
    expirationDate: z.number().min(0).max(1),
  }),
});

export type GifticonAnalysis = z.infer<typeof gifticonAnalysisSchema>;

/**
 * Mirrors gifticonAnalysisSchema in Gemini's own Schema dialect (a subset
 * of OpenAPI, not standard JSON Schema) for Structured Outputs. Keep the
 * two in sync by hand — Gemini's Schema type doesn't support $refs or
 * zod-to-json-schema output directly.
 */
export const geminiResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isGifticon: { type: Type.BOOLEAN },
    brand: { type: Type.STRING, nullable: true },
    productName: { type: Type.STRING, nullable: true },
    category: { type: Type.STRING, enum: [...CATEGORY_VALUES] },
    faceValue: { type: Type.NUMBER, nullable: true },
    quantity: { type: Type.INTEGER, nullable: true },
    expirationDate: {
      type: Type.STRING,
      nullable: true,
      description: "YYYY-MM-DD. Omit (null) if the year is not visible or the date is unreadable.",
    },
    expirationRawText: { type: Type.STRING, nullable: true },
    expirationType: { type: Type.STRING, enum: [...EXPIRATION_TYPE_VALUES] },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
    confidence: {
      type: Type.OBJECT,
      properties: {
        overall: { type: Type.NUMBER },
        brand: { type: Type.NUMBER },
        productName: { type: Type.NUMBER },
        category: { type: Type.NUMBER },
        expirationDate: { type: Type.NUMBER },
      },
      required: ["overall", "brand", "productName", "category", "expirationDate"],
    },
  },
  required: [
    "isGifticon",
    "brand",
    "productName",
    "category",
    "faceValue",
    "quantity",
    "expirationDate",
    "expirationRawText",
    "expirationType",
    "warnings",
    "confidence",
  ],
};
