"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SyncRow = { status: string; created_at: string; row_count: number | null };

function formatKst(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
}

/**
 * 대시보드가 언제 갱신됐는지 보여준다. 자동 취합이 조용히 멈추면 화면만 보고는
 * 옛 데이터인지 알 수 없어서, 갱신이 하루 이상 밀리면 눈에 띄게 표시한다.
 */
export default function LastSyncBadge({ table }: { table: string }) {
  // 경과 시간은 조회 시점에 확정한다. 렌더 중에 Date.now() 를 부르면 리렌더마다
  // 값이 흔들리고, 이 배지는 실시간으로 흐를 필요가 없다.
  const [last, setLast] = useState<
    { row: SyncRow; ageHours: number } | null | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("sync_log")
      .select("status, created_at, row_count")
      .eq("target", table)
      .eq("status", "ok")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data, error }) => {
        if (cancelled) return;
        const row = error ? null : ((data?.[0] as SyncRow) ?? null);
        setLast(
          row
            ? {
                row,
                ageHours:
                  (Date.now() - new Date(row.created_at).getTime()) / 3600000,
              }
            : null,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [table]);

  if (last === undefined || last === null) return null;

  const { row, ageHours } = last;
  const stale = ageHours > 24;

  return (
    <p
      className={`text-xs ${
        stale ? "text-amber-600 dark:text-amber-400" : "text-foreground/50"
      }`}
      title={
        row.row_count === null
          ? undefined
          : `${row.row_count.toLocaleString()}건 반영`
      }
    >
      마지막 갱신 {formatKst(row.created_at)}
      {stale && ` · ${Math.floor(ageHours / 24)}일 경과`}
    </p>
  );
}
