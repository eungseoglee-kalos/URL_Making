export default function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-black/10 px-4 dark:border-white/10 md:px-6">
      <h1 className="text-base font-semibold">대시보드</h1>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-black/10 dark:bg-white/10" />
      </div>
    </header>
  );
}
