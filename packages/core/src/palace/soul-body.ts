/**
 * 命宫身宫计算模块。
 *
 * 核心算法：
 * - 命宫：从寅宫起正月，顺数到生月，再从该宫逆数到生时
 * - 身宫：从寅宫起正月，顺数到生月，再从该宫顺数到生时
 */

import type { EarthlyBranch, TimeIndex } from "../types/base";
import type { StarName } from "../types/star";
import { 地支 } from "../types/base";
import { assertIntInRange, getBranchIndex, mod, required } from "../calendar/utils";

/**
 * 命主星表（根据命宫地支）。
 *
 * 口诀：子贪丑巨寅存卯文，辰廉巳武午破军，
 *       未武申廉酉文曲，戌存亥巨子贪狼。
 */
const SOUL_STAR_MAP: Record<EarthlyBranch, StarName> = {
  子: "贪狼",
  丑: "巨门",
  寅: "禄存",
  卯: "文曲",
  辰: "廉贞",
  巳: "武曲",
  午: "破军",
  未: "武曲",
  申: "廉贞",
  酉: "文曲",
  戌: "禄存",
  亥: "巨门",
};

/**
 * 身主星表（根据年支）。
 *
 * 口诀：子午火星丑未天相，寅申天梁卯酉天同，
 *       辰戌文昌巳亥天机。
 */
const BODY_STAR_MAP: Record<EarthlyBranch, StarName> = {
  子: "火星",
  丑: "天相",
  寅: "天梁",
  卯: "天同",
  辰: "文昌",
  巳: "天机",
  午: "火星",
  未: "天相",
  申: "天梁",
  酉: "天同",
  戌: "文昌",
  亥: "天机",
};

/**
 * 计算命宫地支。
 *
 * 算法：从寅宫起正月，顺数至生月，再从该宫逆数到生时。
 *
 * 口诀：寅起正月顺数至生月，逆数生时为命宫。
 *
 * 公式：命宫地支索引 = (2 + (lunarMonth - 1) - timeIndex) mod 12
 *       简化为：(lunarMonth + 1 - timeIndex) mod 12
 *
 * @param lunarMonth 农历月份（1-12）
 * @param timeIndex 时辰索引（0-11，对应子时到亥时）
 * @returns 命宫地支
 */
export function getSoulPalaceBranch(lunarMonth: number, timeIndex: TimeIndex): EarthlyBranch {
  assertIntInRange(lunarMonth, 1, 12, "lunarMonth");
  if (timeIndex === 12) {
    throw new Error("timeIndex=12 (unknown) is not supported for soul palace calculation");
  }
  assertIntInRange(timeIndex, 0, 11, "timeIndex");

  // 寅宫索引为2，正月起寅：先顺数生月，再逆数生时
  const branchIndex = mod(2 + (lunarMonth - 1) - timeIndex, 12);
  return required(地支[branchIndex], `Earthly branch not found for index=${branchIndex}`);
}

/**
 * 计算身宫地支。
 *
 * 算法：从寅宫起正月，顺数到生月，再从该宫顺数到生时。
 * 公式：身宫地支索引 = (2 + (lunarMonth - 1) + timeIndex) mod 12
 *       简化为：(1 + lunarMonth + timeIndex) mod 12
 *
 * @param lunarMonth 农历月份（1-12）
 * @param timeIndex 时辰索引（0-11，对应子时到亥时）
 * @returns 身宫地支
 */
export function getBodyPalaceBranch(lunarMonth: number, timeIndex: TimeIndex): EarthlyBranch {
  assertIntInRange(lunarMonth, 1, 12, "lunarMonth");
  if (timeIndex === 12) {
    throw new Error("timeIndex=12 (unknown) is not supported for body palace calculation");
  }
  assertIntInRange(timeIndex, 0, 11, "timeIndex");

  // 寅宫索引为2，正月起寅，顺数月份，顺数时辰
  const branchIndex = mod(2 + (lunarMonth - 1) + timeIndex, 12);
  return required(地支[branchIndex], `Earthly branch not found for index=${branchIndex}`);
}

/**
 * 计算命主星（根据命宫地支）。
 *
 * @param soulBranch 命宫地支
 * @returns 命主星名称
 */
export function getSoulStar(soulBranch: EarthlyBranch): StarName {
  getBranchIndex(soulBranch); // 验证地支有效性
  return SOUL_STAR_MAP[soulBranch];
}

/**
 * 计算身主星（根据年支）。
 *
 * @param yearBranch 年支
 * @returns 身主星名称
 */
export function getBodyStar(yearBranch: EarthlyBranch): StarName {
  getBranchIndex(yearBranch); // 验证地支有效性
  return BODY_STAR_MAP[yearBranch];
}
