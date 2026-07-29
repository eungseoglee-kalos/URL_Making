"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SyncRow = { status: string; created_at: string; row_count: number | null };

// 공장이 한 곳뿐이라 "마지막 갱신"은 보는 사람 위치와 무관하게 공장 시간이어야
// 한다. 브라우저 로컬로 그리면 해외에서 보거나 시간대가 잘못 잡힌 노트북에서
// 엉뚱한 시각이 표시된다. hourCycle h23 은 자정을 24시로 쓰는 구현을 피한다.
const KST_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function formatKst(iso: string) {
  const p: Record<string, string> = {};
  for (const { type, value } of KST_FORMAT.formatToParts(new Date(iso))) {
    p[type] = value;
  }
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
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
      마지막 갱신 {formatKst(row.created_at)} (KST)
      {stale && ` · ${Math.floor(ageHours / 24)}일 경과`}
    </p>
  );
}
