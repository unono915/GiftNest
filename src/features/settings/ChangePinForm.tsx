"use client";

import { useState, type FormEvent } from "react";
import { authedJson, ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, Label } from "@/components/ui/field";

export function ChangePinForm() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [logoutOtherDevices, setLogoutOtherDevices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPin !== confirmPin) {
      setError("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    if (newPin.length < 4) {
      setError("새 비밀번호는 4자리 이상이어야 합니다.");
      return;
    }

    setSubmitting(true);
    try {
      await authedJson("/api/settings/pin", {
        method: "POST",
        body: JSON.stringify({ currentPin, newPin, logoutOtherDevices }),
      });
      setSuccess(true);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "변경에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field>
        <Label htmlFor="currentPin">현재 비밀번호</Label>
        <Input
          id="currentPin"
          type="password"
          inputMode="numeric"
          value={currentPin}
          onChange={(e) => setCurrentPin(e.target.value)}
          autoComplete="off"
        />
      </Field>
      <Field>
        <Label htmlFor="newPin">새 비밀번호</Label>
        <Input
          id="newPin"
          type="password"
          inputMode="numeric"
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
          autoComplete="off"
        />
      </Field>
      <Field>
        <Label htmlFor="confirmPin">새 비밀번호 확인</Label>
        <Input
          id="confirmPin"
          type="password"
          inputMode="numeric"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          autoComplete="off"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={logoutOtherDevices}
          onChange={(e) => setLogoutOtherDevices(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-300"
        />
        변경 즉시 다른 기기 모두 로그아웃
      </label>

      {error ? <FieldError>{error}</FieldError> : null}
      {success ? <p className="text-sm font-medium text-emerald-600">비밀번호가 변경되었습니다.</p> : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "변경 중..." : "비밀번호 변경"}
      </Button>
    </form>
  );
}
