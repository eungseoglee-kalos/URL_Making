import StatCard from "@/components/dashboard/StatCard";
import { createClient } from "@/lib/supabase/server";
import { createUrl } from "./actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: urls } = await supabase
    .from("urls")
    .select("*")
    .order("created_at", { ascending: false });

  const totalUrls = urls?.length ?? 0;
  const totalClicks =
    urls?.reduce((sum, url) => sum + (url.click_count ?? 0), 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="총 URL 수" value={String(totalUrls)} />
        <StatCard label="오늘 클릭 수" value="-" />
        <StatCard label="활성 URL" value={String(totalUrls)} />
        <StatCard label="전체 클릭 수" value={String(totalClicks)} />
      </div>

      <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-3 text-sm font-semibold">새 URL 등록</h2>
        <form action={createUrl} className="flex flex-col gap-2 sm:flex-row">
          <input
            name="original_url"
            type="url"
            required
            placeholder="https://example.com/very/long/link"
            className="flex-1 rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30"
          />
          <button className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            등록
          </button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/10">
        <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
          <h2 className="text-sm font-semibold">최근 등록된 URL</h2>
        </div>

        {!urls || urls.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center text-foreground/60">
            <p className="text-sm">아직 등록된 URL이 없습니다.</p>
            <p className="text-xs">위 입력창에 URL을 붙여넣고 등록해보세요.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-foreground/60 dark:border-white/10">
                <th className="px-4 py-2 font-medium">원본 URL</th>
                <th className="px-4 py-2 font-medium">단축 코드</th>
                <th className="px-4 py-2 font-medium">클릭 수</th>
              </tr>
            </thead>
            <tbody>
              {urls.map((url) => (
                <tr
                  key={url.id}
                  className="border-b border-black/10 last:border-0 dark:border-white/10"
                >
                  <td className="max-w-xs truncate px-4 py-2">
                    {url.original_url}
                  </td>
                  <td className="px-4 py-2 font-mono">{url.short_code}</td>
                  <td className="px-4 py-2">{url.click_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
