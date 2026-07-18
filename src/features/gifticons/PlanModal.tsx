"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, Label } from "@/components/ui/field";
import { useMembers } from "@/features/members/useMembers";
import { useAuth } from "@/features/auth/AuthProvider";
import { planGifticon, clearGifticonPlan } from "./api";
import { todayKst } from "@/lib/dates/kst";
import type { Gifticon } from "@/types/domain";

export function PlanModal({ gifticon, onClose }: { gifticon: Gifticon; onClose: () => void }) {
  const { activeMembers } = useMembers();
  const { device } = useAuth();

  const [memberId, setMemberId] = useState(gifticon.plannedMemberId ?? device?.memberId ?? "");
  const [date, setDate] = useState(gifticon.plannedAt?.slice(0, 10) ?? todayKst());
  const [time, setTime] = useState(gifticon.plannedAt?.slice(11, 16) ?? "");
  const [note, setNote] = useState(gifticon.plannedNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const existingMember = activeMembers.find((m) => m.id === gifticon.plannedMemberId);
  const changingOwner = gifticon.plannedMemberId && gifticon.plannedMemberId !== memberId;

  async function handleSubmit() {
    if (!memberId) {
      setError("예정 사용자를 선택해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await planGifticon(gifticon.id, {
        memberId,
        plannedDate: date,
        plannedTime: time || null,
        plannedNote: note.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClear() {
    setSubmitting(true);
    setError(null);
    try {
      await clearGifticonPlan(gifticon.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "해제에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title="사용 예정 설정">
      <div className="flex flex-col gap-4">
        {existingMember ? (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            현재 {existingMember.name}님이 {gifticon.plannedAt?.slice(0, 10)}에 사용 예정입니다.
            {changingOwner ? " 다른 사용자로 변경하시겠습니까?" : ""}
          </p>
        ) : null}

        <Field>
          <Label htmlFor="plan-member">예정 사용자</Label>
          <Select id="plan-member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">선택하세요</option>
            {activeMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.avatarEmoji} {m.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <Label htmlFor="plan-date">날짜</Label>
            <Input id="plan-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="plan-time">시간(선택)</Label>
            <Input id="plan-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>

        <Field>
          <Label htmlFor="plan-note">메모</Label>
          <Textarea id="plan-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="선택 입력" />
        </Field>

        {error ? <FieldError>{error}</FieldError> : null}

        <div className="flex gap-2">
          {gifticon.plannedMemberId ? (
            <Button type="button" variant="outline" onClick={handleClear} disabled={submitting}>
              예정 해제
            </Button>
          ) : null}
          <Button type="button" className="flex-1" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
