export default function PendingApproval() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-black/10 px-4 py-16 text-center dark:border-white/10">
      <p className="text-sm font-medium">승인 대기 중입니다</p>
      <p className="text-xs text-foreground/60">
        관리자 승인이 완료되면 대시보드를 이용하실 수 있습니다.
      </p>
    </div>
  );
}
