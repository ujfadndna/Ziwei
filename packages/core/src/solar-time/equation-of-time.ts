const DEGREE_TO_RADIAN = Math.PI / 180;

function dayOfYear(year: number, month: number, day: number): number {
  const current = Date.UTC(year, month - 1, day);
  const start = Date.UTC(year, 0, 0);
  return Math.floor((current - start) / 86_400_000);
}

/**
 * 使用 Spencer 公式计算时差方程（Equation of Time）。
 *
 * 返回值单位为“分钟”：
 * - 正值：真太阳时领先平均太阳时
 * - 负值：真太阳时落后平均太阳时
 */
export function equationOfTime(year: number, month: number, day: number): number {
  const n = dayOfYear(year, month, day);
  const b = (360 / 365) * (n - 81);
  const bInRadians = b * DEGREE_TO_RADIAN;
  return 9.87 * Math.sin(2 * bInRadians) - 7.53 * Math.cos(bInRadians) - 1.5 * Math.sin(bInRadians);
}
