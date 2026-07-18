import type { GifticonStatus } from "@/types/domain";
import { todayKst, daysUntil } from "./kst";

export type StatusInput = {
  usedAt: string | null;
  expirationDate: string | null;
  needsReview: boolean;
  plannedMemberId: string | null;
  /**
   * Manually archived items stay archived until explicitly restored;
   * PRD 5.13 recommends archiving over deleting completed items, and
   * archival is a deliberate user action rather than a derived state.
   */
  archivedAt: string | null;
};

/**
 * Single source of truth for the displayed Gifticon status.
 * Mirrors PRD 5.10 exactly so client and server never disagree:
 *   1. usedAt present            -> used
 *   2. archivedAt present        -> archived
 *   3. not used, expired         -> expired
 *   4. not used, needs review    -> needs_review
 *   5. not used, has a plan      -> planned
 *   6. otherwise                 -> available
 */
export function computeGifticonStatus(input: StatusInput, today: string = todayKst()): GifticonStatus {
  if (input.usedAt) return "used";
  if (input.archivedAt) return "archived";
  if (input.expirationDate && daysUntil(input.expirationDate, today) < 0) return "expired";
  if (input.needsReview) return "needs_review";
  if (input.plannedMemberId) return "planned";
  return "available";
}
