import type { GifticonCategory } from "@/types/domain";

const CORPORATE_SUFFIXES = [
  "주식회사",
  "(주)",
  "㈜",
  "코리아",
  "커피코리아",
  "Corp.",
  "Corp",
  "Inc.",
  "Inc",
  "Co., Ltd.",
  "Co.,Ltd.",
];

/**
 * Collapses whitespace and strips common corporate suffixes so the same
 * brand always groups together in search/filter (PRD 5.7), independent of
 * whatever exact wording the model returned.
 */
export function normalizeBrand(brand: string | null): string | null {
  if (!brand) return null;
  let normalized = brand.trim().replace(/\s+/g, " ");

  for (const suffix of CORPORATE_SUFFIXES) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length).trim();
    }
  }

  return normalized.length > 0 ? normalized : null;
}

const VALID_CATEGORIES: readonly GifticonCategory[] = [
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
];

/** Defensive re-validation of the category the model returned — falls back to "unknown" rather than trusting an unexpected value. */
export function coerceCategory(category: string): GifticonCategory {
  return (VALID_CATEGORIES as readonly string[]).includes(category)
    ? (category as GifticonCategory)
    : "unknown";
}
