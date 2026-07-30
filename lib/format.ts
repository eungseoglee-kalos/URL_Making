/**
 * 차트 데이터 레이블 서식. recharts 의 LabelList formatter 로 바로 넘긴다.
 *
 * formatter 는 값이 없는 지점에도 호출되므로 null/undefined 를 빈 문자열로
 * 돌려줘야 한다. 그러지 않으면 "0" 이나 "NaN" 이 찍힌다.
 */

/** 천단위 콤마. 소수는 있는 그대로 살린다 (74.6 -> "74.6", 2541 -> "2,541"). */
export function labelNumber(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("ko-KR") : String(v);
}

/** 백분율. 소수 자리는 버린다 (37.09 -> "37%"). */
export function labelPercent(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? `${Math.round(n)}%` : String(v);
}
