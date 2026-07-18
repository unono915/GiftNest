"use client";

import { Dialog } from "./dialog";
import { Button } from "./button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  danger,
  submitting,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  submitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-neutral-600">{description}</p>
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel} disabled={submitting}>
          취소
        </Button>
        <Button
          type="button"
          variant={danger ? "danger" : "primary"}
          className="flex-1"
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting ? "처리 중..." : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
