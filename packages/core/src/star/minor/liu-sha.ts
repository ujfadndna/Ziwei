/**
 * 六煞星及相关星曜安星模块。
 *
 * 六煞星：擎羊、陀罗、火星、铃星、地空、地劫
 * 相关星：禄存、天马
 */

import type { EarthlyBranch, HeavenlyStem } from "../../types/base";
import { mod, getBranchIndex } from "../../calendar/utils";

/**
 * 禄存星位置表（按年干）。
 *
 * 口诀：甲禄在寅，乙禄在卯，丙戊禄在巳，丁己禄在午，庚禄在申，辛禄在酉，壬禄在亥，癸禄在子
 */
const LUCUN_TABLE: Record<HeavenlyStem, number> = {
  甲: 2, // 寅
  乙: 3, // 卯
  丙: 5, // 巳
  丁: 6, // 午
  戊: 5, // 巳
  己: 6, // 午
  庚: 8, // 申
  辛: 9, // 酉
  壬: 11, // 亥
  癸: 0, // 子
};

/**
 * 禄存星位置计算。
 *
 * @param yearStem 年干
 * @returns 禄存星所在宫位索引（0-11）
 */
export function getLucunPosition(yearStem: HeavenlyStem): number {
  return LUCUN_TABLE[yearStem];
}

/**
 * 擎羊星位置计算。
 *
 * 擎羊在禄存前一位（顺行方向）
 *
 * @param yearStem 年干
 * @returns 擎羊星所在宫位索引（0-11）
 */
export function getQingyangPosition(yearStem: HeavenlyStem): number {
  const lucunPos = getLucunPosition(yearStem);
  return mod(lucunPos + 1, 12);
}

/**
 * 陀罗星位置计算。
 *
 * 陀罗在禄存后一位（逆行方向）
 *
 * @param yearStem 年干
 * @returns 陀罗星所在宫位索引（0-11）
 */
export function getTuoluoPosition(yearStem: HeavenlyStem): number {
  const lucunPos = getLucunPosition(yearStem);
  return mod(lucunPos - 1, 12);
}

/**
 * 火星位置表。
 *
 * 按年支分组：寅午戌年、申子辰年、巳酉丑年、亥卯未年
 * 再按时支顺行
 */
const FIRE_STAR_BASE: Record<string, number> = {
  寅午戌: 1, // 丑起
  申子辰: 2, // 寅起
  巳酉丑: 3, // 卯起
  亥卯未: 9, // 酉起
};

/**
 * 获取年支所属的火铃星分组。
 */
function getFireBellGroup(yearBranch: EarthlyBranch): string {
  const groups: Record<string, readonly EarthlyBranch[]> = {
    寅午戌: ["寅", "午", "戌"],
    申子辰: ["申", "子", "辰"],
    巳酉丑: ["巳", "酉", "丑"],
    亥卯未: ["亥", "卯", "未"],
  };

  for (const [group, branches] of Object.entries(groups)) {
    if (branches.includes(yearBranch)) {
      return group;
    }
  }
  throw new Error(`Invalid yearBranch: ${yearBranch}`);
}

/**
 * 火星位置计算。
 *
 * @param yearBranch 年支
 * @param timeBranch 时支
 * @returns 火星所在宫位索引（0-11）
 */
export function getFireStarPosition(yearBranch: EarthlyBranch, timeBranch: EarthlyBranch): number {
  const group = getFireBellGroup(yearBranch);
  const base = FIRE_STAR_BASE[group];
  const timeIndex = getBranchIndex(timeBranch);
  return mod(base + timeIndex, 12);
}

/**
 * 铃星位置表。
 *
 * 按年支分组：寅午戌年、申子辰年、巳酉丑年、亥卯未年
 * 再按时支顺行
 */
const BELL_STAR_BASE: Record<string, number> = {
  寅午戌: 3, // 卯起
  申子辰: 10, // 戌起
  巳酉丑: 10, // 戌起
  亥卯未: 10, // 戌起
};

/**
 * 铃星位置计算。
 *
 * @param yearBranch 年支
 * @param timeBranch 时支
 * @returns 铃星所在宫位索引（0-11）
 */
export function getBellStarPosition(yearBranch: EarthlyBranch, timeBranch: EarthlyBranch): number {
  const group = getFireBellGroup(yearBranch);
  const base = BELL_STAR_BASE[group];
  const timeIndex = getBranchIndex(timeBranch);
  return mod(base + timeIndex, 12);
}

/**
 * 地空星位置计算。
 *
 * 口诀：时支起亥逆行
 * 子时在亥(11)，丑时在戌(10)，依此类推
 *
 * @param timeBranch 时支
 * @returns 地空星所在宫位索引（0-11）
 */
export function getDikongPosition(timeBranch: EarthlyBranch): number {
  const timeIndex = getBranchIndex(timeBranch);
  // 子时(0)在亥(11)，逆行
  return mod(11 - timeIndex, 12);
}

/**
 * 地劫星位置计算。
 *
 * 口诀：时支起亥顺行
 * 子时在亥(11)，丑时在子(0)，依此类推
 *
 * @param timeBranch 时支
 * @returns 地劫星所在宫位索引（0-11）
 */
export function getDijiePosition(timeBranch: EarthlyBranch): number {
  const timeIndex = getBranchIndex(timeBranch);
  // 子时(0)在亥(11)，顺行
  return mod(11 + timeIndex, 12);
}

/**
 * 天马星位置表（按年支）。
 *
 * 口诀：寅午戌马在申，申子辰马在寅，巳酉丑马在亥，亥卯未马在巳
 */
const TIANMA_TABLE: Record<EarthlyBranch, number> = {
  寅: 8, // 申
  午: 8, // 申
  戌: 8, // 申
  申: 2, // 寅
  子: 2, // 寅
  辰: 2, // 寅
  巳: 11, // 亥
  酉: 11, // 亥
  丑: 11, // 亥
  亥: 5, // 巳
  卯: 5, // 巳
  未: 5, // 巳
};

/**
 * 天马星位置计算。
 *
 * @param yearBranch 年支
 * @returns 天马星所在宫位索引（0-11）
 */
export function getTianmaPosition(yearBranch: EarthlyBranch): number {
  return TIANMA_TABLE[yearBranch];
}
