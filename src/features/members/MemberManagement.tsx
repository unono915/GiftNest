"use client";

import { useState, type FormEvent } from "react";
import { useMembers } from "./useMembers";
import { AvatarPicker } from "./AvatarPicker";
import { authedJson, ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, Label } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { AVATAR_EMOJI_OPTIONS } from "@/lib/validation/members";

export function MemberManagement() {
  const { members, loading } = useMembers();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState<string>(AVATAR_EMOJI_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length === 0) {
      setError("이름을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authedJson("/api/members", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), avatarEmoji }),
      });
      setName("");
      setAvatarEmoji(AVATAR_EMOJI_OPTIONS[0]);
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(memberId: string, isActive: boolean) {
    setPendingId(memberId);
    setError(null);
    try {
      await authedJson(`/api/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !isActive }),
      });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "변경에 실패했습니다.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <p className="text-sm text-neutral-500">불러오는 중...</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-neutral-200 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{member.avatarEmoji}</span>
                <span className="font-medium text-neutral-900">{member.name}</span>
                {!member.isActive ? <Badge tone="neutral">비활성</Badge> : null}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pendingId === member.id}
                onClick={() => toggleActive(member.id, member.isActive)}
              >
                {member.isActive ? "비활성화" : "활성화"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error ? <FieldError>{error}</FieldError> : null}

      {showAddForm ? (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-3">
          <Field>
            <Label htmlFor="newMemberName">이름</Label>
            <Input
              id="newMemberName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="예) 할머니"
            />
          </Field>
          <Field>
            <Label>아바타</Label>
            <AvatarPicker value={avatarEmoji} onChange={setAvatarEmoji} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "추가 중..." : "추가"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              취소
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
          + 구성원 추가
        </Button>
      )}
    </div>
  );
}
