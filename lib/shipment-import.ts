import * as XLSX from "xlsx";

export type HeaterCoilRow = {
  ship_date: string;
  part_number: string;
  spec: string | null;
  serial_no: number | null;
  item_id: string | null;
  quantity: number;
  category: string;
  vendor: string;
};

export type MeshRow = {
  ship_date: string;
  part_number: string;
  spec: string | null;
  quantity: number;
  category: string;
  vendor: string;
};

const EXCEL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);

// Same UTC-based conversion as the other importers -- xlsx's cellDates option
// shifts dates by a day on non-UTC servers (this one is Asia/Seoul).
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

function readSheet(workbook: XLSX.WorkBook, name: string): unknown[][] {
  const sheet = workbook.Sheets[name];
  if (!sheet) {
    throw new Error(`시트 "${name}"을 찾을 수 없습니다.`);
  }
  // Row 1 holds a stray max-date cell rather than data, row 2 is the header,
  // so the records start at row 3 (range: 2).
  return XLSX.utils.sheet_to_json(sheet, { header: 1, range: 2, defval: null });
}

export const HEATER_COIL_SHEET = "히터코일출하data";
export const MESH_SHEET = "메시출하data";

// 출하일 | 품번 | 규격 | NO | ID | 수량 | 구분 | 코팅업체
export function parseHeaterCoilExcel(buffer: ArrayBuffer): HeaterCoilRow[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const rows = readSheet(workbook, HEATER_COIL_SHEET);

  const result: HeaterCoilRow[] = [];
  for (const row of rows) {
    const shipDate = toDateString(row[0]);
    if (!shipDate) continue;
    const partNumber = toStr(row[1]);
    if (!partNumber) continue;

    result.push({
      ship_date: shipDate,
      part_number: partNumber,
      spec: toStr(row[2]),
      serial_no: toNum(row[3]),
      item_id: toStr(row[4]),
      quantity: toNum(row[5]) ?? 0,
      category: toStr(row[6]) ?? "",
      vendor: toStr(row[7]) ?? "",
    });
  }

  return result;
}

// 출하일 | 품번 | 규격 | 수량 | 구분 | 메시가공처
export function parseMeshExcel(buffer: ArrayBuffer): MeshRow[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const rows = readSheet(workbook, MESH_SHEET);

  const result: MeshRow[] = [];
  for (const row of rows) {
    const shipDate = toDateString(row[0]);
    if (!shipDate) continue;
    const partNumber = toStr(row[1]);
    if (!partNumber) continue;

    result.push({
      ship_date: shipDate,
      part_number: partNumber,
      spec: toStr(row[2]),
      quantity: toNum(row[3]) ?? 0,
      category: toStr(row[4]) ?? "",
      vendor: toStr(row[5]) ?? "",
    });
  }

  return result;
}
