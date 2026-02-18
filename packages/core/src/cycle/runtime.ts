import type { EarthlyBranch, Gender, StemBranch } from "../types/base";
import type { MonthlyMethod, SmallLimitMethod, YearDivideMethod } from "../types/cycle";
import type { PalaceIndex } from "../types/palace";

import { getGanzhiMonthIndexForSolarDate, getStemBranchOfMonth, getYearStemBranch, parseStemBranch, solarToLunar } from "../calendar";

/**
 * 规范化虚岁（最小 1）。
 */
function normalizeAge(age: number): number {
  if (!Number.isFinite(age)) return 1;
  return Math.max(1, Math.floor(age));
}

function smallLimitStartPalaceIndex(yearBranch: EarthlyBranch): PalaceIndex {
  if (yearBranch === "寅" || yearBranch === "午" || yearBranch === "戌") return 4; // 辰
  if (yearBranch === "申" || yearBranch === "子" || yearBranch === "辰") return 10; // 戌
  if (yearBranch === "巳" || yearBranch === "酉" || yearBranch === "丑") return 7; // 未
  return 1; // 亥卯未 -> 丑
}

/**
 * 按年界口径获取年干支。
 */
export function getYearStemBranchByDivide(
  year: number,
  month: number,
  day: number,
  yearDivide: YearDivideMethod = "lichun"
): StemBranch {
  if (yearDivide === "lunar-year") {
    const lunar = solarToLunar(year, month, day);
    return getYearStemBranch(lunar.year);
  }
  return getYearStemBranch(year, month, day);
}

/**
 * 计算小限所落宫位。
 */
export function getSmallLimitPalaceIndex(
  yearBranch: EarthlyBranch,
  gender: Gender,
  age: number,
  options?: { method?: SmallLimitMethod; mingPalaceIndex?: number }
): PalaceIndex {
  const method = options?.method ?? "year-group";
  const startIndex =
    method === "ming-palace"
      ? ((((options?.mingPalaceIndex ?? 0) % 12) + 12) % 12)
      : smallLimitStartPalaceIndex(yearBranch);
  const direction = gender === "男" ? 1 : -1;
  return ((((startIndex + direction * (normalizeAge(age) - 1)) % 12) + 12) % 12) as PalaceIndex;
}

/**
 * 计算流月干支。
 */
export function getMonthlyStemBranch(
  year: number,
  month: number,
  day: number,
  options?: { method?: MonthlyMethod; yearDivide?: YearDivideMethod }
): StemBranch {
  const method = options?.method ?? "solar-term";
  const yearStemBranch = getYearStemBranchByDivide(year, month, day, options?.yearDivide ?? "lichun");
  const { stem: yearStem } = parseStemBranch(yearStemBranch);

  if (method === "lunar-month") {
    const lunar = solarToLunar(year, month, day);
    return getStemBranchOfMonth(yearStem, lunar.month);
  }

  const monthIndex = getGanzhiMonthIndexForSolarDate(year, month, day);
  return getStemBranchOfMonth(yearStem, monthIndex);
}

