import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="로딩 중"
      className={cn(
        "h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-600",
        className
      )}
    />
  );
}

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
