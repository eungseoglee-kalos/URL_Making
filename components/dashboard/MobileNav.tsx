"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE_ITEMS = [{ href: "/", label: "대시보드 선택" }];

/**
 * Sidebar 는 md 이상에서만 보여서, 그 밑에서는 대시보드 선택/관리자로 갈
 * 방법이 아예 없었다. 같은 항목을 여기 햄버거 메뉴로 다시 노출한다.
 */
export default function MobileNav({ isAdmin }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = isAdmin
    ? [...BASE_ITEMS, { href: "/admin", label: "관리자" }]
    : BASE_ITEMS;

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-label="메뉴 열기"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-md border border-black/10 dark:border-white/10"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="size-5"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav className="absolute left-0 top-full z-50 mt-2 w-48 rounded-md border border-black/10 bg-background p-1 shadow-lg dark:border-white/10">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-black/5 text-foreground dark:bg-white/10"
                      : "text-foreground/60 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
}
