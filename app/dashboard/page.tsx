import StatCard from "@/components/dashboard/StatCard";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="총 URL 수" value="-" />
        <StatCard label="오늘 클릭 수" value="-" />
        <StatCard label="활성 URL" value="-" />
        <StatCard label="전체 클릭 수" value="-" />
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/10">
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
          <h2 className="text-sm font-semibold">최근 등록된 URL</h2>
          <button
            disabled
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background opacity-40"
          >
            새 URL 등록
          </button>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center text-foreground/60">
          <p className="text-sm">아직 등록된 URL이 없습니다.</p>
          <p className="text-xs">
            Supabase 연동이 완료되면 이 목록에 데이터가 표시됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
