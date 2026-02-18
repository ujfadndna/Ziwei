import type { SolarDate } from "../types/chart";

import { assertIntInRange, required } from "./utils";

/**
 * 二十四节气名称表（按算法常用顺序：从小寒开始）。
 */
export const SOLAR_TERMS = [
  "小寒",
  "大寒",
  "立春",
  "雨水",
  "惊蛰",
  "春分",
  "清明",
  "谷雨",
  "立夏",
  "小满",
  "芒种",
  "夏至",
  "小暑",
  "大暑",
  "立秋",
  "处暑",
  "白露",
  "秋分",
  "寒露",
  "霜降",
  "立冬",
  "小雪",
  "大雪",
  "冬至",
] as const;

export type SolarTermName = (typeof SOLAR_TERMS)[number];

/**
 * 24 节气数据（名称表）。
 *
 * 说明：
 * - 为兼容外部调用场景，按任务约定导出为 `is24SolarTerms`
 * - 实际为节气名称数组（并非布尔判断函数）
 */
export const is24SolarTerms = SOLAR_TERMS;

/**
 * 每个节气相对基准时刻的分钟偏移量（1900-01-06 02:05 UTC）。
 *
 * 该表与 `31556925974.7ms` 的回归年常数搭配，是常见的二十四节气近似算法；
 * 在 1900-2100 范围内可满足传统历法应用的日级计算需求。
 */
const SOLAR_TERM_MINUTE_OFFSETS: ReadonlyArray<number> = [
  0,
  21208,
  42467,
  63836,
  85337,
  107014,
  128867,
  150921,
  173149,
  195551,
  218072,
  240693,
  263343,
  285989,
  308563,
  331033,
  353350,
  375494,
  397447,
  419210,
  440795,
  462224,
  483532,
  504758,
];

const SOLAR_TERM_BASE_UTC_MS = Date.UTC(1900, 0, 6, 2, 5);
const TROPICAL_YEAR_MS = 31556925974.7;

export type SolarTermIndex =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23;

function assertSolarTermIndex(index: number): asserts index is SolarTermIndex {
  assertIntInRange(index, 0, 23, "termIndex");
}

function assertValidSolarDate(year: number, month: number, day: number): void {
  assertIntInRange(year, 1900, 2100, "year");
  assertIntInRange(month, 1, 12, "month");
  assertIntInRange(day, 1, 31, "day");

  const utcMs = Date.UTC(year, month - 1, day);
  const date = new Date(utcMs);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid solar date: ${year}-${month}-${day}`);
  }
}

/**
 * 计算某年某节气在公历中的「日」（1-31）。
 *
 * @param year 公历年份
 * @param termIndex 节气索引（0=小寒 ... 23=冬至）
 */
export function getSolarTermDay(year: number, termIndex: SolarTermIndex): number {
  assertIntInRange(year, 1900, 2100, "year");
  assertSolarTermIndex(termIndex);

  const offsetMinutes = required(
    SOLAR_TERM_MINUTE_OFFSETS[termIndex],
    `Solar term minute offset not found for index=${termIndex}`,
  );

  const utcMs = SOLAR_TERM_BASE_UTC_MS + TROPICAL_YEAR_MS * (year - 1900) + offsetMinutes * 60_000;
  const date = new Date(utcMs);

  // 注意：此算法通常以 `getUTCDate()` 取日（避免本地时区影响）
  return date.getUTCDate();
}

/**
 * 计算某年某节气对应的公历日期（年月日）。
 *
 * @param year 公历年份
 * @param termIndex 节气索引（0=小寒 ... 23=冬至）
 */
export function getSolarTermDate(year: number, termIndex: SolarTermIndex): SolarDate {
  assertSolarTermIndex(termIndex);
  const month = Math.floor(termIndex / 2) + 1; // 0-1 -> 1月，2-3 -> 2月 ...
  return { year, month, day: getSolarTermDay(year, termIndex) };
}

/**
 * 立春：干支年的常用分界点（年柱口径通常以立春为界）。
 */
export function getLichunDate(year: number): SolarDate {
  return getSolarTermDate(year, 2);
}

/**
 * 获取某公历日期对应的节气名称（若当天恰好为节气日）。
 *
 * @param year 公历年份（1900-2100）
 * @param month 公历月份（1-12）
 * @param day 公历日期（1-31）
 * @returns 若当天为节气，返回节气名；否则返回 `null`
 */
export function getSolarTerm(year: number, month: number, day: number): SolarTermName | null {
  assertValidSolarDate(year, month, day);

  const termIndex0 = ((month - 1) * 2) as SolarTermIndex;
  const termIndex1 = (termIndex0 + 1) as SolarTermIndex;

  const day0 = getSolarTermDay(year, termIndex0);
  if (day === day0) return required(SOLAR_TERMS[termIndex0], `SOLAR_TERMS missing index=${termIndex0}`);

  const day1 = getSolarTermDay(year, termIndex1);
  if (day === day1) return required(SOLAR_TERMS[termIndex1], `SOLAR_TERMS missing index=${termIndex1}`);

  return null;
}

/**
 * @deprecated 请使用 `getLichunDate`。
 */
export function getLiChunDate(year: number): SolarDate {
  return getLichunDate(year);
}

/**
 * 节气信息（含名称与日期）。
 */
export interface SolarTermInfo {
  /** 节气名称 */
  name: SolarTermName;
  /** 节气日期 */
  date: SolarDate;
}

/**
 * 获取某年全部 24 节气的日期。
 *
 * @param year 公历年份（1900-2100）
 * @returns 24 节气信息数组（按小寒到冬至顺序）
 */
export function getSolarTerms(year: number): SolarTermInfo[] {
  assertIntInRange(year, 1900, 2100, "year");

  const result: SolarTermInfo[] = [];
  for (let i = 0; i < 24; i++) {
    const termIndex = i as SolarTermIndex;
    const name = required(SOLAR_TERMS[termIndex], `SOLAR_TERMS missing index=${termIndex}`);
    const date = getSolarTermDate(year, termIndex);
    result.push({ name, date });
  }
  return result;
}

/**
 * 将公历日期映射为「干支年口径」的年份（以立春为界）。
 *
 * 说明：
 * - 许多术数（八字/紫微部分流派）使用立春作为年柱分界；
 * - 本函数只做「日级」边界判断：在立春当天（不含时刻）一律视为已过立春。
 */
export function getGanzhiYearForSolarDate(year: number, month: number, day: number): number {
  assertValidSolarDate(year, month, day);

  const liChun = getLichunDate(year);

  if (month < liChun.month) return year - 1;
  if (month > liChun.month) return year;
  return day < liChun.day ? year - 1 : year;
}

/**
 * 将公历日期映射为「节气月」索引（1-12，对应寅月..丑月）。
 *
 * 约定：
 * - 1 = 寅月（立春起）
 * - 2 = 卯月（惊蛰起）
 * - ...
 * - 11 = 子月（大雪起）
 * - 12 = 丑月（小寒起）
 *
 * 注意：
 * - 该索引用于计算月干支（年上起月）
 * - 本函数同样是「日级」判断：在节气当天（不含时刻）一律视为已进入新月
 */
export function getGanzhiMonthIndexForSolarDate(year: number, month: number, day: number): number {
  assertValidSolarDate(year, month, day);

  // 12 个“节”（每月第 1 个节气）：小寒、立春、惊蛰、清明、立夏、芒种、小暑、立秋、白露、寒露、立冬、大雪。
  const startIndexByGregorianMonth = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

  const startIndex = required(
    startIndexByGregorianMonth[month - 1],
    `startIndex not found for gregorian month=${month}`,
  );
  const jieIndex = ((month - 1) * 2) as SolarTermIndex; // 1月小寒(0)，2月立春(2)...
  const boundaryDay = getSolarTermDay(year, jieIndex);

  if (day >= boundaryDay) return startIndex;
  return startIndex === 1 ? 12 : startIndex - 1;
}
