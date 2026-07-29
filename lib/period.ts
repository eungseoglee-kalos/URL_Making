/**
 * 대시보드를 열었을 때 처음 보일 기간.
 *
 * "갱신된 날짜"는 취합이 돌아간 시각이 아니라 **데이터에 들어 있는 마지막
 * 날짜**를 쓴다. 둘은 대개 같은 달이지만 월초에 갈린다 -- 8월 2일에 취합이
 * 돌아도 실적은 아직 7월분뿐이라, 취합 시각을 기준으로 삼으면 빈 화면이
 * 열린다. 데이터의 마지막 날짜를 쓰면 항상 값이 있는 달에서 시작한다.
 *
 * 날짜는 전부 YYYY-MM-DD 문자열이라 사전순 비교가 곧 시간순 비교다.
 */
export function periodDefaults(dates: string[]): {
  year: string;
  month: string;
} {
  let max: string | null = null;
  for (const d of dates) {
    if (d && (max === null || d > max)) max = d;
  }
  return max === null
    ? { year: "all", month: "all" }
    : { year: max.slice(0, 4), month: max.slice(5, 7) };
}
