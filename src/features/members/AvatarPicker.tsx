"use client";

import { AVATAR_EMOJI_OPTIONS } from "@/lib/validation/members";
import { cn } from "@/lib/utils";

export function AvatarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="아바타 선택" className="flex flex-wrap gap-2">
      {AVATAR_EMOJI_OPTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="radio"
          aria-checked={value === emoji}
          onClick={() => onChange(emoji)}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition-colors",
            value === emoji
              ? "border-brand-500 bg-brand-50"
              : "border-neutral-200 bg-white hover:bg-neutral-50"
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
