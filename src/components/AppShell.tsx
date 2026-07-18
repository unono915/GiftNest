"use client";

import Link from "next/link";
import { Bell, Search, Settings } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur">
        <Link href="/gifticons" className="text-lg font-bold text-neutral-900">
          GiftNest
        </Link>
        <nav className="flex items-center gap-1">
          <button
            type="button"
            aria-label="검색"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="알림"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
          >
            <Bell className="h-5 w-5" />
          </button>
          <Link
            href="/settings"
            aria-label="설정"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-4">{children}</main>
    </div>
  );
}
