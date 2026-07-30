/**
 * 모든 차트 툴팁에 공통으로 붙이는 속성.
 *
 * recharts 기본 툴팁은 배경이 흰색인데 항목 이름과 값을 계열 색으로 칠한다.
 * 그래서 하늘색(#38bdf8) 같은 밝은 계열은 흰 배경 위에서 거의 안 보이고,
 * 다크모드에서 특히 티가 난다. 배경을 흰색으로 고정하고 글자는 검은색으로
 * 못 박아 어느 테마에서든 같게 읽히게 한다.
 */
export const TOOLTIP_PROPS = {
  contentStyle: {
    backgroundColor: "#ffffff",
    border: "1px solid #d4d4d4",
    borderRadius: 6,
    color: "#171717",
  },
  labelStyle: { color: "#171717", fontWeight: 600 },
  itemStyle: { color: "#171717" },
} as const;

/**
 * 달성률처럼 값이 높은 구간에 몰려 있는 축의 눈금. 0부터 그리면 변화가
 * 뭉개져서 floor 부터 시작하되, 그 아래로 떨어지는 값이 있으면 잘리지 않게
 * 실제 최소값까지 내려간다 -- 나쁜 달을 축 밖으로 숨기는 게 최악이다.
 */
export function percentTicks(
  values: (number | null | undefined)[],
  floor = 50,
  step = 10,
) {
  let min = floor;
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v) && v < min) min = v;
  }
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= 100; t += step) ticks.push(t);
  return { domain: [start, 100] as [number, number], ticks };
}
