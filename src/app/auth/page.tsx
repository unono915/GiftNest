"use client";

import { useState, type FormEvent } from "react";
import { useAuthGuard } from "@/features/auth/useAuthGuard";
import { useAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, Label } from "@/components/ui/field";
import { FullScreenSpinner } from "@/components/ui/spinner";

function formatRetryAfter(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  return `약 ${minutes}분 후 다시 시도해 주세요.`;
}

export default function AuthPage() {
  const status = useAuthGuard("signed-out");
  const { signInWithPin } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status !== "signed-out") return <FullScreenSpinner />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signInWithPin(pin);
      if (!result.success) {
        setError(
          result.retryAfterMs ? `${result.error} ${formatRetryAfter(result.retryAfterMs)}` : result.error
        );
        setPin("");
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-3xl">
            🎁
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">GiftNest</h1>
          <p className="mt-2 text-sm text-neutral-500">가족이 공유하는 기프티콘 관리 페이지입니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Field>
            <Label htmlFor="pin">공용 비밀번호</Label>
            <Input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="PIN을 입력하세요"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={submitting}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "pin-error" : undefined}
              required
              autoFocus
            />
            {error ? <FieldError id="pin-error">{error}</FieldError> : null}
          </Field>

          <Button type="submit" size="lg" disabled={submitting || pin.length === 0}>
            {submitting ? "확인 중..." : "로그인"}
          </Button>
        </form>
      </div>
    </main>
  );
}
