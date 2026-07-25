import { signOut } from "@/app/dashboard/actions";

export default function Topbar({ email }: { email?: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-black/10 px-4 dark:border-white/10 md:px-6">
      <h1 className="text-base font-semibold">대시보드</h1>
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
