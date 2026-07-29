import * as XLSX from "xlsx";

export type VmShipmentRow = {
  ship_date: string;
  part_number: string;
  category: string;
  maker: string;
  spec: string | null;
  quantity: number | null;
  unit_weight_g: number | null;
  weight_kg: number;
};

export type VmBacklogRow = {
  part_number: string;
  category: string;
  spec: string | null;
  quantity: number | null;
  unit_weight_g: number | null;
  weight_kg: number;
};

export const VM_SHIPMENT_SHEET = "출하리스트";
export const VM_BACKLOG_SHEET = "당월 수주 잔량";

const EXCEL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);

// 다른 파서들과 같은 UTC 연산. xlsx 의 cellDates 는 서버 시간대에 따라 날짜를
// 하루씩 밀어버린다 (이 서버는 Asia/Seoul).
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

function toNum(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = toStr(v);
  if (!s) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function sheetOrThrow(workbook: XLSX.WorkBook, name: string) {
  const sheet = workbook.Sheets[name];
  if (!sheet) throw new Error(`시트 "${name}"을 찾을 수 없습니다.`);
  return sheet;
}

// 출고일자 | 품목 | 구분 | 제조사 | 규격 | 출하수량 | 단중(g) | 출하중량(Kg)
// 1행은 "최종예상출하일 : ..." 안내 셀, 2행이 헤더, 3행부터 데이터.
//
// 구분에는 "증착코일 " 처럼 뒤에 공백이 붙은 값이 섞여 있어 (V23 기준 4건),
// toStr 이 trim 하지 않으면 별개 분류로 갈라져 집계가 어긋난다.
export function parseVmShipments(buffer: ArrayBuffer): VmShipmentRow[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const rows: unknown[][] = XLSX.utils.sheet_to_json(
    sheetOrThrow(workbook, VM_SHIPMENT_SHEET),
    { header: 1, range: 2, defval: null },
  );

  const result: VmShipmentRow[] = [];
  for (const row of rows) {
    const shipDate = toDateString(row[0]);
    if (!shipDate) continue;
    const partNumber = toStr(row[1]);
    if (!partNumber) continue;

    result.push({
      ship_date: shipDate,
      part_number: partNumber,
      category: toStr(row[2]) ?? "",
      maker: toStr(row[3]) ?? "",
      spec: toStr(row[4]),
      quantity: toNum(row[5]),
      unit_weight_g: toNum(row[6]),
      weight_kg: toNum(row[7]) ?? 0,
    });
  }

  return result;
}

// 품목 | 구분 | 규격 | 출하수량 | 단중 | 출하중량
// 1행이 헤더, 2행부터 데이터. 날짜 없는 스냅샷이라 통째로 교체한다.
// 오른쪽(I열~)에 요약 피벗이 붙어 있지만 품목 열이 비어 있어 걸러진다.
export function parseVmBacklog(buffer: ArrayBuffer): VmBacklogRow[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const rows: unknown[][] = XLSX.utils.sheet_to_json(
    sheetOrThrow(workbook, VM_BACKLOG_SHEET),
    { header: 1, range: 1, defval: null },
  );

  const result: VmBacklogRow[] = [];
  for (const row of rows) {
    const partNumber = toStr(row[0]);
    const category = toStr(row[1]);
    if (!partNumber || !category) continue;

    result.push({
      part_number: partNumber,
      category,
      spec: toStr(row[2]),
      quantity: toNum(row[3]),
      unit_weight_g: toNum(row[4]),
      weight_kg: toNum(row[5]) ?? 0,
    });
  }

  return result;
}
