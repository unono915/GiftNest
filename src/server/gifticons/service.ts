import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { gifticonsPath } from "@/lib/firebase/paths";
import { nowIso } from "@/lib/dates/kst";
import { computeGifticonStatus } from "@/lib/dates/status";
import { normalizeBrand } from "@/lib/gemini/normalize";
import { recordAuditLog } from "@/server/audit/service";
import { ApiError } from "@/server/http";
import type { Actor } from "@/server/auth/actor";
import type { SaveGifticonInput, UpdateGifticonInput } from "@/lib/validation/gifticon";
import type { PlanGifticonInput, UseGifticonInput } from "@/lib/validation/gifticonActions";
import type { Gifticon } from "@/types/domain";

async function getActiveGifticonOrThrow(gifticonId: string) {
  const ref = getAdminDb().doc(`${gifticonsPath()}/${gifticonId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, "기프티콘을 찾을 수 없습니다.");
  const current = snap.data() as Gifticon;
  if (current.deletedAt) throw new ApiError(404, "삭제된 기프티콘입니다.");
  return { ref, current };
}

async function findDuplicateByHash(imageHash: string | null): Promise<boolean> {
  if (!imageHash) return false;
  const snap = await getAdminDb()
    .collection(gifticonsPath())
    .where("imageHash", "==", imageHash)
    .where("deletedAt", "==", null)
    .limit(1)
    .get();
  return !snap.empty;
}

function buildReviewReasons(input: Pick<SaveGifticonInput, "brand" | "productName" | "expirationDate">) {
  const reasons: string[] = [];
  if (!input.expirationDate) reasons.push("유효기간을 확인하지 못했습니다.");
  if (!input.productName) reasons.push("상품명을 확인하지 못했습니다.");
  if (!input.brand) reasons.push("브랜드를 확인하지 못했습니다.");
  return reasons;
}

export async function saveGifticon(
  actor: Actor,
  input: SaveGifticonInput
): Promise<{ gifticon: Gifticon; duplicateWarning: boolean }> {
  const duplicateWarning = await findDuplicateByHash(input.imageHash);
  const now = nowIso();
  const ref = getAdminDb().collection(gifticonsPath()).doc();

  // Only the missing-date case forces needs_review status (PRD 5.10/5.6);
  // a missing brand/product name is surfaced via reviewReasons as an
  // inline "확인 필요" badge without blocking the item from being usable.
  const needsReview = input.expirationDate === null;
  const reviewReasons = buildReviewReasons(input);

  const status = computeGifticonStatus({
    usedAt: null,
    expirationDate: input.expirationDate,
    needsReview,
    plannedMemberId: null,
    archivedAt: null,
  });

  const gifticon: Gifticon = {
    id: ref.id,
    familyId: "",
    imagePath: input.imagePath,
    thumbnailPath: input.thumbnailPath,
    imageHash: input.imageHash,
    brand: input.brand,
    normalizedBrand: normalizeBrand(input.brand),
    productName: input.productName,
    category: input.category,
    faceValue: input.faceValue,
    quantity: input.quantity,
    expirationDate: input.expirationDate,
    expirationRawText: input.ai?.expirationRawText ?? null,
    expirationType: input.ai?.expirationType ?? "unknown",
    status,
    needsReview,
    reviewReasons,
    aiModel: input.ai?.model ?? null,
    aiConfidence: input.ai?.confidence ?? {
      overall: null,
      brand: null,
      productName: null,
      category: null,
      expirationDate: null,
    },
    aiWarnings: input.ai?.warnings ?? [],
    plannedMemberId: null,
    plannedAt: null,
    plannedNote: null,
    usedMemberId: null,
    usedAt: null,
    usedNote: null,
    memo: input.memo,
    createdByMemberId: actor.memberId,
    createdByDeviceId: actor.deviceId,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    deletedAt: null,
  };

  await ref.set(gifticon);

  await recordAuditLog({
    gifticonId: ref.id,
    memberId: actor.memberId,
    deviceId: actor.deviceId,
    action: "create",
    before: null,
    after: { brand: gifticon.brand, productName: gifticon.productName, status: gifticon.status },
  });
  if (input.ai) {
    await recordAuditLog({
      gifticonId: ref.id,
      memberId: actor.memberId,
      deviceId: actor.deviceId,
      action: "ai_analyzed",
      before: null,
      after: { aiConfidence: gifticon.aiConfidence, aiWarnings: gifticon.aiWarnings },
    });
  }

  return { gifticon, duplicateWarning };
}

export async function updateGifticon(
  actor: Actor,
  gifticonId: string,
  patch: UpdateGifticonInput
): Promise<Gifticon> {
  const ref = getAdminDb().doc(`${gifticonsPath()}/${gifticonId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, "기프티콘을 찾을 수 없습니다.");
  const current = snap.data() as Gifticon;
  if (current.deletedAt) throw new ApiError(404, "삭제된 기프티콘입니다.");

  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  const nextFields: Partial<Gifticon> = {};

  for (const key of ["brand", "productName", "category", "faceValue", "quantity", "expirationDate", "memo"] as const) {
    if (patch[key] === undefined) continue;
    before[key] = current[key];
    after[key] = patch[key];
    (nextFields as Record<string, unknown>)[key] = patch[key];
  }

  if (nextFields.brand !== undefined) {
    nextFields.normalizedBrand = normalizeBrand(nextFields.brand as string | null);
  }

  const needsReview = patch.needsReview ?? current.needsReview;
  if (patch.needsReview !== undefined && patch.needsReview !== current.needsReview) {
    before.needsReview = current.needsReview;
    after.needsReview = patch.needsReview;
  }

  const expirationDate =
    nextFields.expirationDate !== undefined ? (nextFields.expirationDate as string | null) : current.expirationDate;

  const status = computeGifticonStatus({
    usedAt: current.usedAt,
    expirationDate,
    needsReview,
    plannedMemberId: current.plannedMemberId,
    archivedAt: current.archivedAt,
  });

  if (status !== current.status) {
    before.status = current.status;
    after.status = status;
  }

  const updatedAt = nowIso();
  await ref.set(
    { ...nextFields, needsReview, status, reviewReasons: needsReview ? current.reviewReasons : [], updatedAt },
    { merge: true }
  );

  if (Object.keys(after).length > 0) {
    await recordAuditLog({
      gifticonId,
      memberId: actor.memberId,
      deviceId: actor.deviceId,
      action: "update",
      before,
      after,
    });
  }

  const updatedSnap = await ref.get();
  return updatedSnap.data() as Gifticon;
}

function buildPlannedAt(plannedDate: string, plannedTime: string | null | undefined): string {
  return `${plannedDate}T${plannedTime ?? "00:00"}:00+09:00`;
}

export async function planGifticon(actor: Actor, gifticonId: string, input: PlanGifticonInput): Promise<Gifticon> {
  const { ref, current } = await getActiveGifticonOrThrow(gifticonId);

  const before = {
    plannedMemberId: current.plannedMemberId,
    plannedAt: current.plannedAt,
    plannedNote: current.plannedNote,
  };
  const plannedAt = buildPlannedAt(input.plannedDate, input.plannedTime);
  const status = computeGifticonStatus({
    usedAt: current.usedAt,
    expirationDate: current.expirationDate,
    needsReview: current.needsReview,
    plannedMemberId: input.memberId,
    archivedAt: current.archivedAt,
  });

  await ref.set(
    {
      plannedMemberId: input.memberId,
      plannedAt,
      plannedNote: input.plannedNote ?? null,
      status,
      updatedAt: nowIso(),
    },
    { merge: true }
  );

  await recordAuditLog({
    gifticonId,
    memberId: actor.memberId,
    deviceId: actor.deviceId,
    action: current.plannedMemberId ? "plan_changed" : "plan_set",
    before,
    after: { plannedMemberId: input.memberId, plannedAt, plannedNote: input.plannedNote ?? null },
  });

  const snap = await ref.get();
  return snap.data() as Gifticon;
}

export async function clearGifticonPlan(actor: Actor, gifticonId: string): Promise<Gifticon> {
  const { ref, current } = await getActiveGifticonOrThrow(gifticonId);

  const status = computeGifticonStatus({
    usedAt: current.usedAt,
    expirationDate: current.expirationDate,
    needsReview: current.needsReview,
    plannedMemberId: null,
    archivedAt: current.archivedAt,
  });

  await ref.set(
    { plannedMemberId: null, plannedAt: null, plannedNote: null, status, updatedAt: nowIso() },
    { merge: true }
  );

  await recordAuditLog({
    gifticonId,
    memberId: actor.memberId,
    deviceId: actor.deviceId,
    action: "plan_cleared",
    before: {
      plannedMemberId: current.plannedMemberId,
      plannedAt: current.plannedAt,
      plannedNote: current.plannedNote,
    },
    after: { plannedMemberId: null, plannedAt: null, plannedNote: null },
  });

  const snap = await ref.get();
  return snap.data() as Gifticon;
}

/**
 * PRD 14 "동시 수정": a real transaction guards this specifically because
 * two family members marking the same gifticon used at once is the one
 * conflict that actually causes user-visible harm (double-counting a
 * single-use coupon) — everywhere else in this file, last-write-wins is an
 * acceptable tradeoff for a small family app.
 */
export async function markGifticonUsed(actor: Actor, gifticonId: string, input: UseGifticonInput): Promise<Gifticon> {
  const ref = getAdminDb().doc(`${gifticonsPath()}/${gifticonId}`);
  const usedAt = input.usedAt ?? nowIso();

  const before = await getAdminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new ApiError(404, "기프티콘을 찾을 수 없습니다.");
    const current = snap.data() as Gifticon;
    if (current.deletedAt) throw new ApiError(404, "삭제된 기프티콘입니다.");
    if (current.usedAt) throw new ApiError(409, "이미 사용 완료 처리된 기프티콘입니다.");

    tx.set(
      ref,
      {
        usedMemberId: input.memberId,
        usedAt,
        usedNote: input.usedNote ?? null,
        status: "used",
        updatedAt: nowIso(),
      },
      { merge: true }
    );
    return { status: current.status };
  });

  await recordAuditLog({
    gifticonId,
    memberId: actor.memberId,
    deviceId: actor.deviceId,
    action: "use",
    before,
    after: { usedMemberId: input.memberId, usedAt, status: "used" },
  });

  const snap = await ref.get();
  return snap.data() as Gifticon;
}

export async function restoreGifticonUse(actor: Actor, gifticonId: string): Promise<Gifticon> {
  const { ref, current } = await getActiveGifticonOrThrow(gifticonId);
  if (!current.usedAt) throw new ApiError(409, "사용 완료 상태가 아닙니다.");

  const status = computeGifticonStatus({
    usedAt: null,
    expirationDate: current.expirationDate,
    needsReview: current.needsReview,
    plannedMemberId: current.plannedMemberId,
    archivedAt: current.archivedAt,
  });

  await ref.set(
    { usedMemberId: null, usedAt: null, usedNote: null, status, updatedAt: nowIso() },
    { merge: true }
  );

  await recordAuditLog({
    gifticonId,
    memberId: actor.memberId,
    deviceId: actor.deviceId,
    action: "use_cancelled",
    before: { usedMemberId: current.usedMemberId, usedAt: current.usedAt, status: current.status },
    after: { usedMemberId: null, usedAt: null, status },
  });

  const snap = await ref.get();
  return snap.data() as Gifticon;
}

export async function deleteGifticon(actor: Actor, gifticonId: string): Promise<void> {
  const { ref, current } = await getActiveGifticonOrThrow(gifticonId);
  const deletedAt = nowIso();

  await ref.set({ deletedAt, updatedAt: deletedAt }, { merge: true });

  await recordAuditLog({
    gifticonId,
    memberId: actor.memberId,
    deviceId: actor.deviceId,
    action: "delete",
    // PRD 5.13: audit entries for delete keep only minimal metadata, no image paths.
    before: { brand: current.brand, productName: current.productName },
    after: { deletedAt },
  });
}
