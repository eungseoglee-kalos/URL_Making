import * as XLSX from "xlsx";

export type ProductionPlanRow = {
  record_date: string;
  division: string | null;
  department: string | null;
  process: string | null;
  part_number: string | null;
  spec: string | null;
  plan_qty: number | null;
  actual_qty: number | null;
  achievement_rate: number | null;
  achieved: boolean;
  fail_type: string | null;
  fail_reason: string | null;
  improvement: string | null;
  verdict: string;
};

const EXCEL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);

// Same UTC-based conversion as lib/coating-import.ts -- xlsx's cellDates
// option shifts dates by a day on non-UTC servers (this one is Asia/Seoul).
function toDateString(v: unknown): string | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    const d = new Date(EXCEL_EPOCH_UTC_MS + Math.round(v) * 86400000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  if (v instanceof Date && !isNaN(v.getTime())) {
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, "0");
    const d = String(v.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}

function toStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

// 계획수량/실적수량 are normally numbers, but 달성률 comes through as the
// literal string "0%" on rows where the sheet stored text instead of a number.
function toNum(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = toStr(v);
  if (!s) return null;
  const pctMatch = s.endsWith("%");
  const n = Number(s.replace(/[%,\s]/g, ""));
  if (!Number.isFinite(n)) return null;
  return pctMatch ? n / 100 : n;
}

// Mirrors the "계획대비실적data" sheet: one header row, then one row per
// plan/actual pair. Columns beyond 판정 (N) hold standalone slicer lookup
// lists rather than per-row values, so they are ignored.
export function parseProductionPlanExcel(
  buffer: ArrayBuffer,
): ProductionPlanRow[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet = workbook.Sheets["계획대비실적data"];
  if (!sheet) {
    throw new Error('시트 "계획대비실적data"를 찾을 수 없습니다.');
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    range: 1,
    defval: null,
  });

  const result: ProductionPlanRow[] = [];
  for (const row of rows) {
    const recordDate = toDateString(row[0]);
    if (!recordDate) continue;

    const verdict = toStr(row[13]) ?? "";
    if (!verdict) continue;

    result.push({
      record_date: recordDate,
      division: toStr(row[1]),
      department: toStr(row[2]),
      process: toStr(row[3]),
      part_number: toStr(row[4]),
      spec: toStr(row[5]),
      plan_qty: toNum(row[6]),
      actual_qty: toNum(row[7]),
      achievement_rate: toNum(row[8]),
      achieved: verdict === "달성",
      fail_type: toStr(row[10]),
      fail_reason: toStr(row[11]),
      improvement: toStr(row[12]),
      verdict,
    });
  }

  return result;
}
