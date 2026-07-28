"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { createClient } from "@/lib/supabase/client";

type CoatingRecord = {
  id: number;
  coating_lot: string;
  coating_date: string;
  part_number: string;
  serial_no: string | null;
  coating_round: string;
  round_no: number | null;
  position: string | null;
  direction: string | null;
  inspection_date: string | null;
  final_verdict: string;
};

const PIE_COLORS = ["#2563eb", "#93c5fd"];

function isPass(v: string) {
  return v === "1.OK";
}
function isFail(v: string) {
  return v === "2.NG";
}
function isScrap(v: string) {
  return v === "4.폐기";
}
function isPending(v: string) {
  return v === "3.검사대기";
}

function passRate(records: CoatingRecord[]) {
  const pass = records.filter((r) => isPass(r.final_verdict)).length;
  const fail = records.filter((r) => isFail(r.final_verdict)).length;
  const denom = pass + fail;
  return denom === 0 ? null : pass / denom;
}

function pct(v: number | null) {
  return v === null ? "-" : `${Math.round(v * 100)}%`;
}

function cellColor(v: number | null) {
  if (v === null) return "";
  if (v < 0.7) return "bg-red-500 text-white";
  if (v < 0.85) return "bg-blue-100";
  if (v < 0.95) return "bg-blue-300";
  return "bg-blue-500 text-white";
}

async function fetchAllCoatingRecords(): Promise<CoatingRecord[]> {
  const supabase = createClient();
  const pageSize = 1000;
  let from = 0;
  let all: CoatingRecord[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("coating_records")
      .select(
        "id, coating_lot, coating_date, part_number, serial_no, coating_round, round_no, position, direction, inspection_date, final_verdict",
      )
      .order("coating_date", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all = all.concat(data as CoatingRecord[]);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

export default function CoatingPage() {
  const [records, setRecords] = useState<CoatingRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAllCoatingRecords()
      .then(setRecords)
      .catch((e) => setError(e.message ?? "데이터를 불러오지 못했습니다."));
  }, []);

  const partNumbers = useMemo(() => {
    if (!records) return [];
    return Array.from(new Set(records.map((r) => r.part_number))).sort();
  }, [records]);

  const years = useMemo(() => {
    if (!records) return [];
    return Array.from(
      new Set(records.map((r) => r.coating_date.slice(0, 4))),
    ).sort();
  }, [records]);

  const partFiltered = useMemo(() => {
    if (!records) return [];
    if (selectedParts.size === 0) return records;
    return records.filter((r) => selectedParts.has(r.part_number));
  }, [records, selectedParts]);

  const filtered = useMemo(() => {
    return partFiltered.filter((r) => {
      if (year !== "all" && r.coating_date.slice(0, 4) !== year) return false;
      if (month !== "all" && r.coating_date.slice(5, 7) !== month)
        return false;
      return true;
    });
  }, [partFiltered, year, month]);

  const kpi = useMemo(() => {
    const total = filtered.length;
    const pass = filtered.filter((r) => isPass(r.final_verdict)).length;
    const fail = filtered.filter((r) => isFail(r.final_verdict)).length;
    const scrap = filtered.filter((r) => isScrap(r.final_verdict)).length;
    return { total, pass, fail, scrap };
  }, [filtered]);

  const queues = useMemo(() => {
    const byLot = new Map<string, CoatingRecord>();
    for (const r of partFiltered) {
      const cur = byLot.get(r.coating_lot);
      if (!cur || (r.round_no ?? 0) > (cur.round_no ?? 0)) {
        byLot.set(r.coating_lot, r);
      }
    }
    const latest = Array.from(byLot.values());
    const rounds = [1, 2, 3, 4, 5];
    const inspectionWaiting: Record<number, number> = {};
    const coatingWaiting: Record<number, number> = {};
    for (const round of rounds) {
      inspectionWaiting[round] = latest.filter(
        (r) => r.round_no === round && isPending(r.final_verdict),
      ).length;
      coatingWaiting[round] = latest.filter(
        (r) => r.round_no === round - 1 && isFail(r.final_verdict),
      ).length;
    }
    return { rounds, inspectionWaiting, coatingWaiting };
  }, [partFiltered]);

  const monthlyTrend = useMemo(() => {
    const byMonth = new Map<string, CoatingRecord[]>();
    for (const r of partFiltered) {
      const key = r.coating_date.slice(0, 7);
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(r);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, recs]) => {
        const total = recs.length;
        const scrap = recs.filter((r) => isScrap(r.final_verdict)).length;
        const rate = passRate(recs);
        return {
          month: key.slice(5, 7) + "월",
          total,
          passRatePct: rate === null ? null : Math.round(rate * 100),
          scrapRatePct: total === 0 ? 0 : Math.round((scrap / total) * 100),
        };
      });
  }, [partFiltered]);

  const roundRate = useMemo(() => {
    return [1, 2, 3].map((round) => {
      const recs = filtered.filter((r) => r.round_no === round);
      return {
        round: `${round}차`,
        ratePct: (() => {
          const r = passRate(recs);
          return r === null ? 0 : Math.round(r * 100);
        })(),
      };
    });
  }, [filtered]);

  const positionRate = useMemo(() => {
    return ["UP", "DOWN"]
      .map((pos) => {
        const recs = filtered.filter((r) => r.position === pos);
        const r = passRate(recs);
        return { name: pos, value: r === null ? 0 : Math.round(r * 1000) / 10 };
      })
      .filter((d) => d.value > 0);
  }, [filtered]);

  const partRate = useMemo(() => {
    const parts = Array.from(new Set(filtered.map((r) => r.part_number)));
    return parts
      .map((p) => {
        const recs = filtered.filter((r) => r.part_number === p);
        const r = passRate(recs);
        return { part: p, ratePct: r === null ? null : Math.round(r * 100) };
      })
      .filter((d) => d.ratePct !== null)
      .sort((a, b) => (b.ratePct ?? 0) - (a.ratePct ?? 0))
      .slice(0, 10);
  }, [filtered]);

  const dailyTable = useMemo(() => {
    const byDate = new Map<string, CoatingRecord[]>();
    for (const r of filtered) {
      if (!byDate.has(r.coating_date)) byDate.set(r.coating_date, []);
      byDate.get(r.coating_date)!.push(r);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, recs]) => {
        const rounds: Record<number, number | null> = {};
        for (const round of [1, 2, 3, 4]) {
          rounds[round] = passRate(recs.filter((r) => r.round_no === round));
        }
        return { date, rounds, total: passRate(recs) };
      });
  }, [filtered]);

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (!records) {
    return <p className="text-sm text-foreground/60">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs text-foreground/60">
            연도
          </label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-md border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/10"
          >
            <option value="all">전체</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-foreground/60">월</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/10"
          >
            <option value="all">전체</option>
            {Array.from({ length: 12 }, (_, i) =>
              String(i + 1).padStart(2, "0"),
            ).map((m) => (
              <option key={m} value={m}>
                {Number(m)}월
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-foreground/60">품번</span>
          <div className="flex flex-wrap gap-3">
            {partNumbers.map((p) => (
              <label key={p} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={selectedParts.has(p)}
                  onChange={(e) => {
                    const next = new Set(selectedParts);
                    if (e.target.checked) next.add(p);
                    else next.delete(p);
                    setSelectedParts(next);
                  }}
                />
                {p}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="투입량" value={kpi.total} />
        <KpiCard label="합격" value={kpi.pass} />
        <KpiCard label="불합격" value={kpi.fail} />
        <KpiCard label="폐기" value={kpi.scrap} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="mb-2 text-sm font-semibold">검사 대기 (차수별)</p>
          <div className="grid grid-cols-5 gap-2 text-center">
            {queues.rounds.map((r) => (
              <div key={r}>
                <p className="text-xs text-foreground/60">{r}차</p>
                <p className="text-lg font-semibold">
                  {queues.inspectionWaiting[r] || "-"}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="mb-2 text-sm font-semibold">코팅 대기 (차수별)</p>
          <div className="grid grid-cols-5 gap-2 text-center">
            {queues.rounds.map((r) => (
              <div key={r}>
                <p className="text-xs text-foreground/60">{r}차</p>
                <p className="text-lg font-semibold">
                  {queues.coatingWaiting[r] || "-"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
        <p className="mb-4 text-sm font-semibold">
          월별 생산수량, 합격률 및 폐기율
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis yAxisId="left" fontSize={12} />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              fontSize={12}
            />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="total"
              name="생산수량"
              fill="#60a5fa"
            />
            <Line
              yAxisId="right"
              dataKey="passRatePct"
              name="합격률(%)"
              stroke="#1e3a8a"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              dataKey="scrapRatePct"
              name="폐기율(%)"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="mb-4 text-sm font-semibold">차수별 합격률</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={roundRate}>
              <XAxis dataKey="round" fontSize={12} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip />
              <Bar dataKey="ratePct" name="합격률(%)" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="mb-4 text-sm font-semibold">위치별 합격률</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={positionRate}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label={(d) => `${d.name} ${d.value}%`}
              >
                {positionRate.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="mb-4 text-sm font-semibold">품번별 합격률</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={partRate} layout="vertical">
              <XAxis type="number" domain={[0, 100]} fontSize={12} />
              <YAxis
                type="category"
                dataKey="part"
                width={100}
                fontSize={11}
              />
              <Tooltip />
              <Bar dataKey="ratePct" name="합격률(%)" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/10">
        <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
          <p className="text-sm font-semibold">일자별 차수별 합격률</p>
        </div>
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-black/10 text-left dark:border-white/10">
                <th className="px-3 py-2 font-medium">코팅일자</th>
                <th className="px-3 py-2 font-medium">1차</th>
                <th className="px-3 py-2 font-medium">2차</th>
                <th className="px-3 py-2 font-medium">3차</th>
                <th className="px-3 py-2 font-medium">4차</th>
                <th className="px-3 py-2 font-medium">합계</th>
              </tr>
            </thead>
            <tbody>
              {dailyTable.map((row) => (
                <tr
                  key={row.date}
                  className="border-b border-black/5 dark:border-white/5"
                >
                  <td className="px-3 py-1.5">{row.date}</td>
                  {[1, 2, 3, 4].map((r) => (
                    <td
                      key={r}
                      className={`px-3 py-1.5 text-center ${cellColor(row.rounds[r])}`}
                    >
                      {pct(row.rounds[r])}
                    </td>
                  ))}
                  <td
                    className={`px-3 py-1.5 text-center font-medium ${cellColor(row.total)}`}
                  >
                    {pct(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <p className="text-sm text-foreground/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
