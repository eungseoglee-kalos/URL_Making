"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/dashboard/urls", label: "URL 목록" },
  { href: "/dashboard/settings", label: "설정" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-black/10 dark:border-white/10 md:flex md:flex-col">
      <div className="flex h-16 items-center px-6 text-lg font-semibold">
        URL Making
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
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
    </aside>
  );
}
