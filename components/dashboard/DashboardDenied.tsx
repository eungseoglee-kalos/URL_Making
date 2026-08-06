export default function DashboardDenied() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-black/10 px-4 py-16 text-center dark:border-white/10">
      <p className="text-sm font-medium">이 대시보드에 대한 열람 권한이 없습니다</p>
      <p className="text-xs text-foreground/60">
        필요하시면 관리자에게 열람 권한을 요청해주세요.
      </p>
    </div>
  );
}
