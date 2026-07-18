"use client";

import { useEffect, useState } from "react";
import { DEFAULT_FILTER_STATE, type GifticonFilterState } from "./filters";

const STORAGE_KEY = "giftnest_gifticon_filters";

function loadInitial(): GifticonFilterState {
  if (typeof window === "undefined") return DEFAULT_FILTER_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FILTER_STATE;
    return { ...DEFAULT_FILTER_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FILTER_STATE;
  }
}

/** PRD 5.7: "필터와 정렬 상태는 해당 기기에서 기억한다." */
export function useGifticonFilters() {
  const [filters, setFilters] = useState<GifticonFilterState>(loadInitial);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  function update(patch: Partial<GifticonFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function reset() {
    setFilters(DEFAULT_FILTER_STATE);
  }

  return { filters, update, reset };
}
