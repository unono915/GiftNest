"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/features/auth/useAuthGuard";
import { AppShell } from "@/components/AppShell";
import { FullScreenSpinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useGifticon } from "@/features/gifticons/useGifticon";
import { useMembers } from "@/features/members/useMembers";
import { useStorageUrl } from "@/lib/firebase/useStorageUrl";
import { GifticonForm, type GifticonFormValues } from "@/features/gifticons/GifticonForm";
import { PlanModal } from "@/features/gifticons/PlanModal";
import { UseModal } from "@/features/gifticons/UseModal";
import { AuditLogList } from "@/features/gifticons/AuditLogList";
import { deleteGifticon, restoreGifticonUse, updateGifticon } from "@/features/gifticons/api";
import { ApiClientError } from "@/lib/api/client";
import { STATUS_BADGE_TONE, formatDDayLabel } from "@/features/gifticons/statusDisplay";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/types/domain";

type Modal = "plan" | "use" | "delete" | "restore" | null;

export default function GifticonDetailPage() {
  const status = useAuthGuard("profile-complete");
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { gifticon, loading } = useGifticon(params.id);
  const { members } = useMembers();
  const imageUrl = useStorageUrl(gifticon?.imagePath ?? null);

  const [editing, setEditing] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [zoomed, setZoomed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status !== "ready" || loading) return <FullScreenSpinner />;

  if (!gifticon) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-neutral-600">기프티콘을 찾을 수 없습니다.</p>
          <Button onClick={() => router.push("/gifticons")}>목록으로</Button>
        </div>
      </AppShell>
    );
  }

  const createdByMember = members.find((m) => m.id === gifticon.createdByMemberId);
  const plannedMember = members.find((m) => m.id === gifticon.plannedMemberId);
  const usedMember = members.find((m) => m.id === gifticon.usedMemberId);

  async function handleUpdate(values: GifticonFormValues) {
    setSubmitting(true);
    setActionError(null);
    try {
      await updateGifticon(gifticon!.id, {
        brand: values.brand.trim() || null,
        productName: values.productName.trim() || null,
        category: values.category,
        faceValue: values.faceValue.trim() === "" ? null : Number(values.faceValue),
        quantity: values.quantity.trim() === "" ? null : Number(values.quantity),
        expirationDate: values.expirationDate || null,
        memo: values.memo.trim() || null,
        needsReview: values.expirationDate === "" ? true : undefined,
        // PRD 14 "동시 수정": if another device saved first, the server
        // rejects this with 409 instead of silently overwriting it — the
        // live onSnapshot subscription already shows the newer data, so
        // closing edit mode is enough to surface it.
        expectedUpdatedAt: gifticon!.updatedAt,
      });
      setEditing(false);
    } catch (err) {
      const isConflict = err instanceof ApiClientError && err.status === 409;
      setActionError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      if (isConflict) setEditing(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    setActionError(null);
    try {
      await deleteGifticon(gifticon!.id);
      router.push("/gifticons");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
      setSubmitting(false);
    }
  }

  async function handleRestoreUse() {
    setSubmitting(true);
    setActionError(null);
    try {
      await restoreGifticonUse(gifticon!.id);
      setModal(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "취소에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell hideAddButton>
      <div className="mx-auto flex max-w-lg flex-col gap-4 pb-20">
        {imageUrl ? (
          <button type="button" onClick={() => setZoomed(true)} className="overflow-hidden rounded-2xl bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element -- Firebase Storage download URL */}
            <img src={imageUrl} alt={gifticon.productName ?? "기프티콘 이미지"} className="w-full object-contain" />
          </button>
        ) : null}

        {editing ? (
          <Card>
            <GifticonForm
              initialValues={{
                brand: gifticon.brand ?? "",
                productName: gifticon.productName ?? "",
                category: gifticon.category,
                faceValue: gifticon.faceValue != null ? String(gifticon.faceValue) : "",
                quantity: gifticon.quantity != null ? String(gifticon.quantity) : "",
                expirationDate: gifticon.expirationDate ?? "",
                memo: gifticon.memo ?? "",
              }}
              submitLabel="저장"
              submitting={submitting}
              onSubmit={handleUpdate}
            />
            <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setEditing(false)}>
              취소
            </Button>
          </Card>
        ) : (
          <>
            <div>
              <p className="text-sm text-neutral-500">{gifticon.brand ?? "브랜드 미확인"}</p>
              <h1 className="text-xl font-bold text-neutral-900">{gifticon.productName ?? "상품명 확인 필요"}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={STATUS_BADGE_TONE[gifticon.status]}>{STATUS_LABELS[gifticon.status]}</Badge>
                <Badge tone="neutral">{CATEGORY_LABELS[gifticon.category]}</Badge>
                {gifticon.status !== "used" ? (
                  <span className="text-sm font-medium text-neutral-500">{formatDDayLabel(gifticon.expirationDate)}</span>
                ) : null}
              </div>
            </div>

            <Card className="flex flex-col gap-1 text-sm">
              <Row label="유효기간" value={gifticon.expirationDate ?? "확인 필요"} />
              <Row label="금액" value={gifticon.faceValue != null ? `${gifticon.faceValue.toLocaleString()}원` : "-"} />
              <Row label="수량" value={gifticon.quantity != null ? `${gifticon.quantity}개` : "-"} />
              <Row
                label="등록자"
                value={`${createdByMember ? `${createdByMember.avatarEmoji} ${createdByMember.name}` : "알 수 없음"} · ${new Date(gifticon.createdAt).toLocaleDateString("ko-KR")}`}
              />
              {gifticon.memo ? <Row label="메모" value={gifticon.memo} /> : null}
            </Card>

            {gifticon.aiModel ? (
              <Card>
                <p className="mb-2 text-sm font-semibold text-neutral-900">AI 분석 정보</p>
                <p className="text-sm text-neutral-600">
                  전체 신뢰도 {gifticon.aiConfidence.overall != null ? Math.round(gifticon.aiConfidence.overall * 100) : "-"}%
                </p>
                {gifticon.aiWarnings.length > 0 ? (
                  <ul className="mt-1 text-sm text-amber-700">
                    {gifticon.aiWarnings.map((w) => (
                      <li key={w}>⚠ {w}</li>
                    ))}
                  </ul>
                ) : null}
                {gifticon.reviewReasons.length > 0 ? (
                  <ul className="mt-1 text-sm text-amber-700">
                    {gifticon.reviewReasons.map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            ) : null}

            {gifticon.plannedMemberId ? (
              <Card>
                <p className="text-sm font-semibold text-neutral-900">사용 예정</p>
                <p className="mt-1 text-sm text-neutral-600">
                  {plannedMember ? `${plannedMember.avatarEmoji} ${plannedMember.name}` : "알 수 없음"} ·{" "}
                  {gifticon.plannedAt?.slice(0, 16).replace("T", " ")}
                </p>
                {gifticon.plannedNote ? <p className="mt-1 text-sm text-neutral-500">{gifticon.plannedNote}</p> : null}
              </Card>
            ) : null}

            {gifticon.usedMemberId ? (
              <Card>
                <p className="text-sm font-semibold text-neutral-900">사용 완료</p>
                <p className="mt-1 text-sm text-neutral-600">
                  {usedMember ? `${usedMember.avatarEmoji} ${usedMember.name}` : "알 수 없음"} ·{" "}
                  {gifticon.usedAt ? new Date(gifticon.usedAt).toLocaleString("ko-KR") : ""}
                </p>
                {gifticon.usedNote ? <p className="mt-1 text-sm text-neutral-500">{gifticon.usedNote}</p> : null}
              </Card>
            ) : null}

            <Card>
              <p className="mb-2 text-sm font-semibold text-neutral-900">변경 이력</p>
              <AuditLogList gifticonId={gifticon.id} />
            </Card>
          </>
        )}

        {actionError ? <p className="text-sm font-medium text-red-600">{actionError}</p> : null}

        {!editing ? (
          <div className="fixed inset-x-0 bottom-0 z-10 flex gap-2 border-t border-neutral-200 bg-white p-3">
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              수정
            </Button>
            {gifticon.status !== "used" ? (
              <>
                <Button type="button" variant="outline" onClick={() => setModal("plan")}>
                  사용 예정
                </Button>
                <Button type="button" className="flex-1" onClick={() => setModal("use")}>
                  사용 완료
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModal("restore")}>
                사용 완료 취소
              </Button>
            )}
            <Button type="button" variant="danger" onClick={() => setModal("delete")}>
              삭제
            </Button>
          </div>
        ) : null}
      </div>

      {zoomed && imageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setZoomed(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Firebase Storage download URL */}
          <img src={imageUrl} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      ) : null}

      {modal === "plan" ? <PlanModal gifticon={gifticon} onClose={() => setModal(null)} /> : null}
      {modal === "use" ? (
        <UseModal gifticon={gifticon} onClose={() => setModal(null)} onUsed={() => setModal(null)} />
      ) : null}
      <ConfirmDialog
        open={modal === "delete"}
        title="기프티콘 삭제"
        description="삭제한 기프티콘은 목록에서 사라집니다. 계속할까요?"
        confirmLabel="삭제"
        danger
        submitting={submitting}
        onConfirm={handleDelete}
        onCancel={() => setModal(null)}
      />
      <ConfirmDialog
        open={modal === "restore"}
        title="사용 완료 취소"
        description="다시 사용 가능 상태로 되돌립니다."
        confirmLabel="취소하기"
        submitting={submitting}
        onConfirm={handleRestoreUse}
        onCancel={() => setModal(null)}
      />
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right text-neutral-900">{value}</span>
    </div>
  );
}
