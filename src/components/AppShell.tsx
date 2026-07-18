"use client";

import Link from "next/link";
import { Bell, Plus, Search, Settings } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children, hideAddButton }: { children: ReactNode; hideAddButton?: boolean }) {
  return (
    <div className="min-h-screen pb-24">
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

      {hideAddButton ? null : (
        <Link
          href="/gifticons/new"
          aria-label="기프티콘 추가"
          className="fixed bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 md:hidden"
        >
          <Plus className="h-6 w-6" />
        </Link>
      )}
    </div>
  );
}
