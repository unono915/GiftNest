"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useMembers } from "@/features/members/useMembers";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/types/domain";
import type { GifticonFilterState } from "./filters";
import type { Gifticon } from "@/types/domain";

export function FilterBar({
  filters,
  onChange,
  gifticons,
}: {
  filters: GifticonFilterState;
  onChange: (patch: Partial<GifticonFilterState>) => void;
  gifticons: Gifticon[];
}) {
  const { activeMembers } = useMembers();
  const brands = Array.from(new Set(gifticons.map((g) => g.normalizedBrand).filter((b): b is string => Boolean(b)))).sort(
    (a, b) => a.localeCompare(b, "ko")
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="브랜드, 상품명, 메모로 검색"
          className="pl-9"
          aria-label="기프티콘 검색"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as GifticonFilterState["status"] })}
          className="w-auto"
          aria-label="상태 필터"
        >
          <option value="all">전체 상태</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value as GifticonFilterState["category"] })}
          className="w-auto"
          aria-label="카테고리 필터"
        >
          <option value="all">전체 카테고리</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={filters.brand}
          onChange={(e) => onChange({ brand: e.target.value })}
          className="w-auto"
          aria-label="브랜드 필터"
        >
          <option value="all">전체 브랜드</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </Select>

        <Select
          value={filters.due}
          onChange={(e) => onChange({ due: e.target.value as GifticonFilterState["due"] })}
          className="w-auto"
          aria-label="기한 필터"
        >
          <option value="all">전체 기한</option>
          <option value="today">오늘</option>
          <option value="3d">3일 이내</option>
          <option value="7d">7일 이내</option>
          <option value="30d">30일 이내</option>
          <option value="none">날짜 없음</option>
        </Select>

        <Select
          value={filters.memberId}
          onChange={(e) => onChange({ memberId: e.target.value })}
          className="w-auto"
          aria-label="구성원 필터"
        >
          <option value="all">전체 구성원</option>
          {activeMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.avatarEmoji} {m.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as GifticonFilterState["sort"] })}
          className="w-auto"
          aria-label="정렬"
        >
          <option value="expiry_asc">유효기간 임박순</option>
          <option value="created_desc">최근 등록순</option>
          <option value="created_asc">오래된 등록순</option>
          <option value="brand_asc">브랜드명순</option>
          <option value="used_desc">최근 사용 완료순</option>
        </Select>
      </div>
    </div>
  );
}
