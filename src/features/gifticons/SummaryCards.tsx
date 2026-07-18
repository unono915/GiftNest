import { getExpiryBucket, todayKst } from "@/lib/dates/kst";
import type { GifticonFilterState } from "./filters";
import type { Gifticon } from "@/types/domain";

export function SummaryCards({
  gifticons,
  onSelect,
}: {
  gifticons: Gifticon[];
  onSelect?: (patch: Partial<GifticonFilterState>) => void;
}) {
  const today = todayKst();
  const counts = {
    available: 0,
    planned: 0,
    expiringSoon: 0,
    needsReview: 0,
    used: 0,
  };

  for (const g of gifticons) {
    if (g.status === "available") counts.available += 1;
    if (g.status === "planned") counts.planned += 1;
    if (g.status === "used") counts.used += 1;
    if (g.needsReview) counts.needsReview += 1;
    if (g.expirationDate && g.status !== "used") {
      const bucket = getExpiryBucket(g.expirationDate, today);
      if (bucket === "today" || bucket === "d1" || bucket === "d3" || bucket === "d7") counts.expiringSoon += 1;
    }
  }

  const items: { label: string; value: number; patch: Partial<GifticonFilterState> }[] = [
    { label: "사용 가능", value: counts.available, patch: { status: "available", due: "all" } },
    { label: "사용 예정", value: counts.planned, patch: { status: "planned", due: "all" } },
    { label: "7일 이내 만료", value: counts.expiringSoon, patch: { status: "all", due: "7d" } },
    { label: "확인 필요", value: counts.needsReview, patch: { status: "needs_review", due: "all" } },
    { label: "사용 완료", value: counts.used, patch: { status: "used", due: "all", sort: "used_desc" } },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onSelect?.(item.patch)}
          className="rounded-xl border border-neutral-200 bg-white p-3 text-center hover:bg-neutral-50"
        >
          <p className="text-lg font-bold text-neutral-900">{item.value}</p>
          <p className="text-xs text-neutral-500">{item.label}</p>
        </button>
      ))}
    </div>
  );
}
