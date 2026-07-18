const KST_TIME_ZONE = "Asia/Seoul";

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: KST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Returns the Asia/Seoul calendar date (YYYY-MM-DD) for a given instant.
 * Defaults to the current instant. Used as the single source of truth for
 * "today" everywhere D-Day / expiry logic needs it, so server and client
 * agree regardless of the machine's local timezone.
 */
export function toKstDateString(date: Date = new Date()): string {
  return KST_DATE_FORMATTER.format(date);
}

export function todayKst(): string {
  return toKstDateString(new Date());
}

const DATE_STRING_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: string): boolean {
  if (!DATE_STRING_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function dateStringToUtcMidnight(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/**
 * Calendar-day difference (targetDate - fromDate), both as YYYY-MM-DD strings.
 * Computed via UTC midnight anchors for each date string so no timezone or
 * DST conversion can shift the result by a day.
 */
export function daysBetween(fromDate: string, targetDate: string): number {
  const from = dateStringToUtcMidnight(fromDate);
  const target = dateStringToUtcMidnight(targetDate);
  return Math.round((target - from) / (24 * 60 * 60 * 1000));
}

export function daysUntil(targetDate: string, from: string = todayKst()): number {
  return daysBetween(from, targetDate);
}

export type ExpiryBucket =
  | "expired"
  | "today"
  | "d1"
  | "d3"
  | "d7"
  | "later"
  | "none";

/**
 * Buckets a nullable expiration date relative to "today" in KST.
 * Expiration day itself is D-Day ("today"); the day after is "expired"
 * (PRD 5.10: 만료일 당일은 D-Day, 다음 날부터 만료).
 */
export function getExpiryBucket(expirationDate: string | null, from: string = todayKst()): ExpiryBucket {
  if (!expirationDate) return "none";
  const diff = daysUntil(expirationDate, from);
  if (diff < 0) return "expired";
  if (diff === 0) return "today";
  if (diff === 1) return "d1";
  if (diff <= 3) return "d3";
  if (diff <= 7) return "d7";
  return "later";
}

export function nowIso(): string {
  return new Date().toISOString();
}
