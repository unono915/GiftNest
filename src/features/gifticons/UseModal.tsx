"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldHint, Label } from "@/components/ui/field";
import { useMembers } from "@/features/members/useMembers";
import { useAuth } from "@/features/auth/AuthProvider";
import { markGifticonUsed } from "./api";
import type { Gifticon } from "@/types/domain";

function nowForDatetimeLocal(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function UseModal({
  gifticon,
  onClose,
  onUsed,
}: {
  gifticon: Gifticon;
  onClose: () => void;
  onUsed: () => void;
}) {
  const { activeMembers } = useMembers();
  const { device } = useAuth();

  const [memberId, setMemberId] = useState(device?.memberId ?? "");
  const [usedAtLocal, setUsedAtLocal] = useState(nowForDatetimeLocal());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const plannedMember = activeMembers.find((m) => m.id === gifticon.plannedMemberId);
  const differsFromPlan = useMemo(
    () => gifticon.plannedMemberId && memberId && gifticon.plannedMemberId !== memberId,
    [gifticon.plannedMemberId, memberId]
  );

  async function handleSubmit() {
    if (!memberId) {
      setError("사용자를 선택해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await markGifticonUsed(gifticon.id, {
        memberId,
        usedAt: new Date(usedAtLocal).toISOString(),
        usedNote: note.trim() || null,
      });
      onUsed();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title="사용 완료">
      <div className="flex flex-col gap-4">
        {differsFromPlan ? (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            {plannedMember?.name ?? "다른 구성원"}님이 사용 예정이었습니다. 실제 사용자와 다릅니다.
          </p>
        ) : null}

        <Field>
          <Label htmlFor="use-member">사용한 구성원</Label>
          <Select id="use-member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">선택하세요</option>
            {activeMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.avatarEmoji} {m.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field>
          <Label htmlFor="use-datetime">사용 일시</Label>
          <Input
            id="use-datetime"
            type="datetime-local"
            value={usedAtLocal}
            onChange={(e) => setUsedAtLocal(e.target.value)}
          />
        </Field>

        <Field>
          <Label htmlFor="use-note">메모</Label>
          <Textarea id="use-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="선택 입력" />
          <FieldHint>완료 후에도 상세 화면에서 취소할 수 있습니다.</FieldHint>
        </Field>

        {error ? <FieldError>{error}</FieldError> : null}

        <Button type="button" size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "처리 중..." : "사용 완료 확인"}
        </Button>
      </div>
    </Dialog>
  );
}
