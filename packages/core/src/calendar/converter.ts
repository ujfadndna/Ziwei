import type { EarthlyBranch, HeavenlyStem, StemBranch, StemBranchParts } from "../types/base";
import { 地支, 天干 } from "../types/base";
import type { GanzhiDate, LunarDate, SolarDate } from "../types/chart";

import { LUNAR_DATA_END_YEAR, LUNAR_DATA_START_YEAR, LUNAR_INFO } from "./lunar-data";
import { getGanzhiMonthIndexForSolarDate, getGanzhiYearForSolarDate } from "./solar-terms";
import {
  assertIntInRange,
  getStemIndex,
  mod,
  required,
  splitStemBranch,
  stemBranchFromIndex,
  stemBranchFromParts,
} from "./utils";

const DAY_MS = 86_400_000;
const BASE_SOLAR_UTC_MS = Date.UTC(1900, 0, 31); // 1900-01-31 对应 农历 1900-01-01
const MIN_SUPPORTED_SOLAR_UTC_MS = BASE_SOLAR_UTC_MS;
const MAX_SUPPORTED_SOLAR_UTC_MS = Date.UTC(2100, 11, 31);

function getYearInfo(year: number): number {
  assertIntInRange(year, LUNAR_DATA_START_YEAR, LUNAR_DATA_END_YEAR, "year");
  const index = year - LUNAR_DATA_START_YEAR;
  return required(LUNAR_INFO[index], `LUNAR_INFO missing year=${year} (index=${index})`);
}

/**
 * 闰月月份：0 表示无闰月；1-12 表示闰几月。
 */
function leapMonth(year: number): number {
  return getYearInfo(year) & 0xf;
}

/**
 * 闰月天数：0/29/30。
 */
function leapDays(year: number): number {
  const lm = leapMonth(year);
  if (lm === 0) return 0;
  return (getYearInfo(year) & 0x10000) !== 0 ? 30 : 29;
}

/**
 * 某农历年某月的天数（29/30）。
 *
 * @param month 1-12（正月=1）
 */
function monthDays(year: number, month: number): number {
  assertIntInRange(month, 1, 12, "month");
  return (getYearInfo(year) & (0x10000 >> month)) !== 0 ? 30 : 29;
}

/**
 * 某农历年的总天数（含闰月）。
 */
function lunarYearDays(year: number): number {
  let sum = 348; // 12 * 29
  const info = getYearInfo(year);
  for (let mask = 0x8000; mask > 0x8; mask >>= 1) {
    if ((info & mask) !== 0) sum += 1;
  }
  return sum + leapDays(year);
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

function assertSolarInSupportedRange(year: number, month: number, day: number): void {
  assertValidSolarDate(year, month, day);
  const utcMs = Date.UTC(year, month - 1, day);
  if (utcMs < MIN_SUPPORTED_SOLAR_UTC_MS || utcMs > MAX_SUPPORTED_SOLAR_UTC_MS) {
    const min = new Date(MIN_SUPPORTED_SOLAR_UTC_MS);
    const max = new Date(MAX_SUPPORTED_SOLAR_UTC_MS);
    throw new Error(
      `Solar date out of supported range: ${year}-${month}-${day} (supported ${min.getUTCFullYear()}-${
        min.getUTCMonth() + 1
      }-${min.getUTCDate()} .. ${max.getUTCFullYear()}-${max.getUTCMonth() + 1}-${max.getUTCDate()})`,
    );
  }
}

/**
 * 公历转农历（1900-2100）。
 *
 * @param year 公历年
 * @param month 公历月（1-12）
 * @param day 公历日（1-31）
 */
export function solarToLunar(year: number, month: number, day: number): LunarDate {
  assertSolarInSupportedRange(year, month, day);

  const targetUtcMs = Date.UTC(year, month - 1, day);
  let offsetDays = Math.floor((targetUtcMs - BASE_SOLAR_UTC_MS) / DAY_MS);

  // 1) 定位农历年
  let lunarYear = LUNAR_DATA_START_YEAR;
  while (lunarYear <= LUNAR_DATA_END_YEAR) {
    const daysInYear = lunarYearDays(lunarYear);
    if (offsetDays < daysInYear) break;
    offsetDays -= daysInYear;
    lunarYear += 1;
  }

  if (lunarYear > LUNAR_DATA_END_YEAR) {
    throw new Error(`Solar date exceeds supported lunar year range: ${year}-${month}-${day}`);
  }

  // 2) 定位农历月/日（含闰月）
  const leap = leapMonth(lunarYear);
  let isLeapMonth = false;
  let lunarMonth = 1;
  let daysInMonth = 0;

  while (lunarMonth <= 12) {
    if (leap > 0 && lunarMonth === leap + 1 && !isLeapMonth) {
      lunarMonth -= 1;
      isLeapMonth = true;
      daysInMonth = leapDays(lunarYear);
    } else {
      daysInMonth = monthDays(lunarYear, lunarMonth);
    }

    if (offsetDays < daysInMonth) break;

    offsetDays -= daysInMonth;

    // 闰月走完后，回到正常月份序列
    if (isLeapMonth && lunarMonth === leap) {
      isLeapMonth = false;
    }

    lunarMonth += 1;
  }

  const lunarDay = offsetDays + 1;

  // 返回值约定：`isLeap` 始终提供（与 `lunarToSolar(..., isLeap)` 入参一致）。
  const result: LunarDate = { year: lunarYear, month: lunarMonth, day: lunarDay, isLeap: isLeapMonth };
  return result;
}

/**
 * 农历转公历（1900-2100）。
 *
 * @param year 农历年
 * @param month 农历月（1-12；闰月同月号）
 * @param day 农历日（1-30）
 * @param isLeap 是否闰月
 */
export function lunarToSolar(year: number, month: number, day: number, isLeap: boolean): SolarDate {
  assertIntInRange(year, LUNAR_DATA_START_YEAR, LUNAR_DATA_END_YEAR, "year");
  assertIntInRange(month, 1, 12, "month");
  if (!Number.isInteger(day) || day < 1 || day > 30) {
    throw new Error(`Invalid lunar date day: ${day} (expected 1-30)`);
  }

  const leap = leapMonth(year);
  if (isLeap && leap !== month) {
    throw new Error(`Year ${year} does not have leap month ${month}`);
  }

  // 校验 day 上限（不同月 29/30，闰月亦然）
  const maxDay = isLeap ? leapDays(year) : monthDays(year, month);
  if (day > maxDay) {
    throw new Error(
      `Invalid lunar date day: year=${year} month=${month}${isLeap ? " (leap)" : ""} day=${day} (max=${maxDay})`,
    );
  }

  let offsetDays = 0;

  // 1) 累加整年
  for (let y = LUNAR_DATA_START_YEAR; y < year; y += 1) {
    offsetDays += lunarYearDays(y);
  }

  // 2) 累加整月（含闰月插入）
  for (let m = 1; m < month; m += 1) {
    offsetDays += monthDays(year, m);
    if (leap === m) {
      offsetDays += leapDays(year);
    }
  }

  // 3) 若目标为闰月，需要先跨过同名的“正常月”
  if (isLeap) {
    offsetDays += monthDays(year, month);
  }

  // 4) 加上当月日偏移
  offsetDays += day - 1;

  const utcMs = BASE_SOLAR_UTC_MS + offsetDays * DAY_MS;
  const date = new Date(utcMs);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

/**
 * 拆分干支为（天干/地支）。
 *
 * @param stemBranch 干支（六十甲子之一）
 */
export function parseStemBranch(stemBranch: StemBranch): StemBranchParts {
  return splitStemBranch(stemBranch);
}

/**
 * 获取年干支（六十甲子，以立春为界）。
 *
 * 说明：
 * - 若只传入 `year`，则视为「干支年口径」的年份（即：该干支年从当年立春起算）
 * - 若额外传入 `month/day`，则会按立春边界自动回推（立春前算上一干支年）
 */
export function getStemBranchOfYear(year: number): StemBranch;
export function getStemBranchOfYear(year: number, month: number, day: number): StemBranch;
export function getStemBranchOfYear(year: number, month?: number, day?: number): StemBranch {
  if (month === undefined && day === undefined) return getYearStemBranch(year);
  if (month === undefined || day === undefined) {
    throw new Error("getStemBranchOfYear(year, month, day) requires both month and day when using solar-date mode");
  }
  return getYearStemBranch(year, month, day);
}

/**
 * 获取月干支（年上起月）。
 *
 * 约定：
 * - `month` 为节气月索引（1-12），对应 寅月..丑月
 * - 月支固定从寅开始：1=寅，2=卯，...，11=子，12=丑
 *
 * @param yearStem 年柱天干（甲/乙/.../癸）
 * @param month 节气月索引（1-12，寅月=1）
 */
export function getStemBranchOfMonth(yearStem: HeavenlyStem, month: number): StemBranch {
  assertIntInRange(month, 1, 12, "month");

  const yearStemIndex = getStemIndex(yearStem);
  // 甲己年起丙寅；乙庚年起戊寅；丙辛年起庚寅；丁壬年起壬寅；戊癸年起甲寅
  const firstMonthStemIndex = mod(yearStemIndex * 2 + 2, 10);
  const monthStemIndex = mod(firstMonthStemIndex + (month - 1), 10);

  const monthBranchIndex = mod(month + 1, 12); // 1->寅(2)，...，12->丑(1)
  const stem = required(天干[monthStemIndex], `Heavenly stem not found for index=${monthStemIndex}`);
  const branch = required(地支[monthBranchIndex], `Earthly branch not found for index=${monthBranchIndex}`) as EarthlyBranch;

  return stemBranchFromParts(stem, branch);
}

/**
 * 获取日干支（以公历日期计算）。
 */
export function getStemBranchOfDay(year: number, month: number, day: number): StemBranch {
  return getDayStemBranch(year, month, day);
}

/**
 * 获取时干支（由日干推时干）。
 *
 * @param dayStem 日干（天干）
 * @param hour 0-23（公历小时）
 */
export function getStemBranchOfHour(dayStem: HeavenlyStem, hour: number): StemBranch {
  return getHourStemBranch(dayStem, hour);
}

/**
 * 获取年干支（六十甲子）。
 *
 * 说明：
 * - 若只传入 `year`，则视为「干支年口径」的年份（即：该干支年从当年立春起算）
 * - 若额外传入 `month/day`，则会按立春边界自动回推（立春前算上一干支年）
 */
export function getYearStemBranch(year: number): StemBranch;
export function getYearStemBranch(year: number, month: number, day: number): StemBranch;
export function getYearStemBranch(year: number, month?: number, day?: number): StemBranch {
  assertIntInRange(year, 1, 9999, "year");

  if (month !== undefined || day !== undefined) {
    if (month === undefined || day === undefined) {
      throw new Error("getYearStemBranch(year, month, day) requires both month and day when using solar-date mode");
    }
    const ganzhiYear = getGanzhiYearForSolarDate(year, month, day);
    return stemBranchFromIndex(mod(ganzhiYear - 4, 60));
  }

  return stemBranchFromIndex(mod(year - 4, 60));
}

/**
 * 获取月干支（年上起月）。
 *
 * 约定：
 * - `month` 为节气月索引（1-12），对应 寅月..丑月
 * - 月支固定从寅开始：1=寅，2=卯，...，11=子，12=丑
 *
 * 若你持有公历日期，可先用 `getGanzhiMonthIndexForSolarDate`（见 solar-terms.ts）转换为节气月索引。
 */
export function getMonthStemBranch(year: number, month: number): StemBranch {
  assertIntInRange(year, 1, 9999, "year");
  assertIntInRange(month, 1, 12, "month");

  // 年干（0-9）：以 4 年为甲子起点的映射
  const yearStemIndex = mod(year - 4, 10);
  const yearStem = required(天干[yearStemIndex], `Heavenly stem not found for index=${yearStemIndex}`);
  return getStemBranchOfMonth(yearStem, month);
}

/**
 * 获取日干支（以公历日期计算）。
 */
export function getDayStemBranch(year: number, month: number, day: number): StemBranch {
  assertSolarInSupportedRange(year, month, day);

  const utcMs = Date.UTC(year, month - 1, day);
  const offsetDays = Math.floor((utcMs - BASE_SOLAR_UTC_MS) / DAY_MS);

  // 1900-01-31 为 甲辰日（六十甲子索引 40），与常见农历算法保持一致
  const dayIndex = mod(offsetDays + 40, 60);
  return stemBranchFromIndex(dayIndex);
}

/**
 * 获取时干支（由日干推时干）。
 *
 * @param dayStem 日干（天干）
 * @param hour 0-23（公历小时）
 */
export function getHourStemBranch(dayStem: HeavenlyStem, hour: number): StemBranch {
  assertIntInRange(hour, 0, 23, "hour");
  const dayStemIndex = getStemIndex(dayStem);

  // 子时：23:00-00:59；按小时离散映射：((hour + 1) / 2) 向下取整
  const hourBranchIndex = mod(Math.floor((hour + 1) / 2), 12);
  const branch = required(地支[hourBranchIndex], `Earthly branch not found for index=${hourBranchIndex}`) as EarthlyBranch;

  // 甲己日起甲子；乙庚日起丙子；丙辛日起戊子；丁壬日起庚子；戊癸日起壬子
  const ziStemIndex = (dayStemIndex % 5) * 2;
  const hourStemIndex = mod(ziStemIndex + hourBranchIndex, 10);
  const stem = required(天干[hourStemIndex], `Heavenly stem not found for index=${hourStemIndex}`);

  return stemBranchFromParts(stem, branch);
}

/**
 * 获取年月日时干支（以公历日期/小时输入）。
 *
 * 说明：
 * - 年柱：以立春为界（立春前算上一干支年）
 * - 月柱：以「节」为界（小寒/立春/惊蛰/.../大雪）
 * - 日柱：以公历日（UTC 日界）计算（1900-01-31 为基准）
 * - 时柱：按日干推时干，子时覆盖 23:00-00:59
 *
 * @param year 公历年（1900-2100）
 * @param month 公历月（1-12）
 * @param day 公历日（1-31）
 * @param hour 公历小时（0-23）
 */
export function getStemBranch(year: number, month: number, day: number, hour: number): GanzhiDate {
  // 复用公历有效性/范围校验（避免本地时区造成的隐式变化）
  assertSolarInSupportedRange(year, month, day);
  assertIntInRange(hour, 0, 23, "hour");

  const ganzhiYear = getGanzhiYearForSolarDate(year, month, day);
  const yearStemBranch = getYearStemBranch(ganzhiYear);

  const ganzhiMonthIndex = getGanzhiMonthIndexForSolarDate(year, month, day);
  const monthStemBranch = getMonthStemBranch(ganzhiYear, ganzhiMonthIndex);

  const dayStemBranch = getDayStemBranch(year, month, day);
  const { stem: dayStem } = splitStemBranch(dayStemBranch);
  const timeStemBranch = getHourStemBranch(dayStem, hour);

  return {
    year: yearStemBranch,
    month: monthStemBranch,
    day: dayStemBranch,
    time: timeStemBranch,
  };
}
