import { describe, expect, it } from "vitest";
import { daysBetween, getExpiryBucket, isValidDateString, toKstDateString } from "@/lib/dates/kst";
import { computeGifticonStatus } from "@/lib/dates/status";

describe("toKstDateString", () => {
  it("converts a UTC instant just before KST midnight to the previous KST day", () => {
    // 2026-07-17T15:00:00Z == 2026-07-18T00:00:00+09:00 exactly
    expect(toKstDateString(new Date("2026-07-17T14:59:59Z"))).toBe("2026-07-17");
    expect(toKstDateString(new Date("2026-07-17T15:00:00Z"))).toBe("2026-07-18");
  });
});

describe("isValidDateString", () => {
  it("accepts real calendar dates", () => {
    expect(isValidDateString("2026-02-28")).toBe(true);
  });

  it("rejects impossible calendar dates", () => {
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("not-a-date")).toBe(false);
  });
});

describe("daysBetween", () => {
  it("computes whole calendar-day differences without drifting across month boundaries", () => {
    expect(daysBetween("2026-07-31", "2026-08-01")).toBe(1);
    expect(daysBetween("2026-08-01", "2026-07-31")).toBe(-1);
    expect(daysBetween("2026-07-18", "2026-07-18")).toBe(0);
  });
});

describe("getExpiryBucket", () => {
  const today = "2026-07-18";

  it("buckets the expiration day itself as today (D-Day), not expired", () => {
    expect(getExpiryBucket("2026-07-18", today)).toBe("today");
  });

  it("buckets the day after expiration as expired", () => {
    expect(getExpiryBucket("2026-07-17", today)).toBe("expired");
  });

  it("buckets D-1, D-3 window, and D-7 window correctly", () => {
    expect(getExpiryBucket("2026-07-19", today)).toBe("d1");
    expect(getExpiryBucket("2026-07-21", today)).toBe("d3");
    expect(getExpiryBucket("2026-07-25", today)).toBe("d7");
    expect(getExpiryBucket("2026-08-01", today)).toBe("later");
  });

  it("returns none for a missing expiration date", () => {
    expect(getExpiryBucket(null, today)).toBe("none");
  });
});

describe("computeGifticonStatus", () => {
  const today = "2026-07-18";
  const base = {
    usedAt: null,
    expirationDate: null,
    needsReview: false,
    plannedMemberId: null,
    archivedAt: null,
  };

  it("prioritizes used over every other signal", () => {
    expect(
      computeGifticonStatus(
        { ...base, usedAt: "2026-07-01T00:00:00Z", expirationDate: "2026-06-01", needsReview: true },
        today
      )
    ).toBe("used");
  });

  it("prioritizes archived over expired/planned/review when not used", () => {
    expect(
      computeGifticonStatus(
        { ...base, archivedAt: "2026-07-01T00:00:00Z", expirationDate: "2026-06-01" },
        today
      )
    ).toBe("archived");
  });

  it("marks unused, past-due gifticons as expired", () => {
    expect(computeGifticonStatus({ ...base, expirationDate: "2026-06-01" }, today)).toBe("expired");
  });

  it("marks the expiration day itself as still available (not expired yet)", () => {
    expect(computeGifticonStatus({ ...base, expirationDate: today }, today)).toBe("available");
  });

  it("marks unresolved review items as needs_review even with a future date", () => {
    expect(
      computeGifticonStatus({ ...base, expirationDate: "2026-12-31", needsReview: true }, today)
    ).toBe("needs_review");
  });

  it("marks items with a planned user as planned", () => {
    expect(
      computeGifticonStatus({ ...base, expirationDate: "2026-12-31", plannedMemberId: "m1" }, today)
    ).toBe("planned");
  });

  it("falls back to available", () => {
    expect(computeGifticonStatus({ ...base, expirationDate: "2026-12-31" }, today)).toBe("available");
    expect(computeGifticonStatus(base, today)).toBe("available");
  });
});
