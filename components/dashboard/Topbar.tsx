import Link from "next/link";
import { signOut } from "@/app/login/actions";
import MobileNav from "./MobileNav";

export default function Topbar({
  email,
  isAdmin,
}: {
  email?: string;
  isAdmin?: boolean;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-black/10 px-4 dark:border-white/10 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav isAdmin={isAdmin} />
        <Link href="/" className="text-base font-semibold">
          대시보드
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {email && (
          <span className="text-sm text-foreground/60">{email}</span>
        )}
        <form action={signOut}>
          <button className="rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/10">
            로그아웃
          </button>
        </form>
      </div>
    </header>
  );
}
