"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/features/auth/useAuthGuard";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMembers } from "@/features/members/useMembers";
import { AvatarPicker } from "@/features/members/AvatarPicker";
import { authedJson } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, Label } from "@/components/ui/field";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FullScreenSpinner } from "@/components/ui/spinner";
import { AVATAR_EMOJI_OPTIONS } from "@/lib/validation/members";
import { cn } from "@/lib/utils";
import type { Device, Member } from "@/types/domain";

export default function ProfileSetupPage() {
  const status = useAuthGuard("profile-complete");
  const router = useRouter();
  const { applyRegisteredDevice } = useAuth();
  const { activeMembers, loading: membersLoading } = useMembers();

  const [selectedMemberId, setSelectedMemberId] = useState<string | "new" | null>(null);
  const [newName, setNewName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState<string>(AVATAR_EMOJI_OPTIONS[0]);
  const [deviceName, setDeviceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "checking" || status === "signed-out") return <FullScreenSpinner />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedMemberId) {
      setError("나를 선택하거나 새 구성원으로 등록해 주세요.");
      return;
    }
    if (deviceName.trim().length === 0) {
      setError("기기 이름을 입력해 주세요.");
      return;
    }
    if (selectedMemberId === "new" && newName.trim().length === 0) {
      setError("이름을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      let memberId = selectedMemberId;
      if (selectedMemberId === "new") {
        const created = await authedJson<{ member: Member }>("/api/members", {
          method: "POST",
          body: JSON.stringify({ name: newName.trim(), avatarEmoji }),
        });
        memberId = created.member.id;
      }

      const { device } = await authedJson<{ device: Device }>("/api/devices/register", {
        method: "POST",
        body: JSON.stringify({ memberId, deviceName: deviceName.trim() }),
      });
      applyRegisteredDevice(device);
      router.replace("/gifticons");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="text-center">
        <h1 className="text-xl font-bold text-neutral-900">프로필을 등록해 주세요</h1>
        <p className="mt-1 text-sm text-neutral-500">
          이 정보는 등록자, 사용 예정자, 사용 완료자 표시에 사용됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Card className="flex flex-col gap-3">
          <div>
            <CardTitle>나는 누구인가요?</CardTitle>
            <CardDescription>기존 구성원을 선택하거나 새로 등록하세요.</CardDescription>
          </div>

          {!membersLoading && activeMembers.length > 0 ? (
            <div className="flex flex-col gap-2">
              {activeMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMemberId(member.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    selectedMemberId === member.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  <span className="text-2xl">{member.avatarEmoji}</span>
                  <span className="font-medium text-neutral-900">{member.name}</span>
                </button>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setSelectedMemberId("new")}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-dashed p-3 text-left transition-colors",
              selectedMemberId === "new"
                ? "border-brand-500 bg-brand-50"
                : "border-neutral-300 hover:bg-neutral-50"
            )}
          >
            <span className="text-2xl">➕</span>
            <span className="font-medium text-neutral-900">새 구성원으로 등록</span>
          </button>

          {selectedMemberId === "new" ? (
            <div className="flex flex-col gap-3 pt-1">
              <Field>
                <Label htmlFor="name">이름 또는 별명</Label>
                <Input
                  id="name"
                  placeholder="예) 아빠, 엄마, 윤호"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={20}
                />
              </Field>
              <Field>
                <Label>아바타</Label>
                <AvatarPicker value={avatarEmoji} onChange={setAvatarEmoji} />
              </Field>
            </div>
          ) : null}
        </Card>

        <Card>
          <Field>
            <Label htmlFor="deviceName">이 기기 이름</Label>
            <Input
              id="deviceName"
              placeholder="예) 윤호 아이폰, 거실 태블릿"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              maxLength={30}
            />
          </Field>
        </Card>

        {error ? <FieldError>{error}</FieldError> : null}

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "등록 중..." : "시작하기"}
        </Button>
      </form>
    </main>
  );
}
