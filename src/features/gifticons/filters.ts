import { daysUntil, todayKst } from "@/lib/dates/kst";
import type { Gifticon, GifticonCategory, GifticonStatus } from "@/types/domain";
import type { Member } from "@/types/domain";

export type DueFilter = "all" | "today" | "3d" | "7d" | "30d" | "none";
export type SortOption = "expiry_asc" | "created_desc" | "created_asc" | "brand_asc" | "used_desc";

export type GifticonFilterState = {
  search: string;
  status: GifticonStatus | "all";
  category: GifticonCategory | "all";
  brand: string | "all";
  due: DueFilter;
  memberId: string | "all";
  sort: SortOption;
};

export const DEFAULT_FILTER_STATE: GifticonFilterState = {
  search: "",
  status: "all",
  category: "all",
  brand: "all",
  due: "all",
  memberId: "all",
  sort: "expiry_asc",
};

function matchesSearch(gifticon: Gifticon, search: string, members: Member[]): boolean {
  if (!search.trim()) return true;
  const needle = search.trim().toLowerCase();
  const plannedName = members.find((m) => m.id === gifticon.plannedMemberId)?.name ?? "";
  const usedName = members.find((m) => m.id === gifticon.usedMemberId)?.name ?? "";
  const haystack = [gifticon.brand, gifticon.productName, gifticon.memo, plannedName, usedName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function matchesDue(gifticon: Gifticon, due: DueFilter, today: string): boolean {
  if (due === "all") return true;
  if (due === "none") return gifticon.expirationDate === null;
  if (!gifticon.expirationDate) return false;
  const diff = daysUntil(gifticon.expirationDate, today);
  if (diff < 0) return false;
  if (due === "today") return diff === 0;
  if (due === "3d") return diff <= 3;
  if (due === "7d") return diff <= 7;
  return diff <= 30;
}

function matchesMember(gifticon: Gifticon, memberId: string): boolean {
  return (
    gifticon.createdByMemberId === memberId ||
    gifticon.plannedMemberId === memberId ||
    gifticon.usedMemberId === memberId
  );
}

export function applyGifticonFilters(
  gifticons: Gifticon[],
  filters: GifticonFilterState,
  members: Member[],
  today: string = todayKst()
): Gifticon[] {
  return gifticons.filter((g) => {
    if (filters.status !== "all" && g.status !== filters.status) return false;
    if (filters.category !== "all" && g.category !== filters.category) return false;
    if (filters.brand !== "all" && g.normalizedBrand !== filters.brand) return false;
    if (filters.memberId !== "all" && !matchesMember(g, filters.memberId)) return false;
    if (!matchesDue(g, filters.due, today)) return false;
    if (!matchesSearch(g, filters.search, members)) return false;
    return true;
  });
}

export function sortGifticons(gifticons: Gifticon[], sort: SortOption): Gifticon[] {
  const sorted = gifticons.slice();
  switch (sort) {
    case "expiry_asc":
      return sorted.sort((a, b) => {
        if (a.expirationDate === null && b.expirationDate === null) return 0;
        if (a.expirationDate === null) return 1;
        if (b.expirationDate === null) return -1;
        return a.expirationDate.localeCompare(b.expirationDate);
      });
    case "created_desc":
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "created_asc":
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "brand_asc":
      return sorted.sort((a, b) => (a.brand ?? "").localeCompare(b.brand ?? "", "ko"));
    case "used_desc":
      return sorted.sort((a, b) => (b.usedAt ?? "").localeCompare(a.usedAt ?? ""));
    default:
      return sorted;
  }
}
