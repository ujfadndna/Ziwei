/**
 * 六吉星安星模块。
 *
 * 六吉星：左辅、右弼、文昌、文曲、天魁、天钺
 */

import type { EarthlyBranch, HeavenlyStem } from "../../types/base";
import { getBranchIndex, mod } from "../../calendar/utils";

/**
 * 左辅星位置计算。
 *
 * 口诀：农历月起辰顺行
 * 正月在辰(4)，二月在巳(5)，依此类推
 *
 * @param lunarMonth 农历月（1-12）
 * @returns 左辅星所在宫位索引（0-11）
 */
export function getLeftAssistantPosition(lunarMonth: number): number {
  if (lunarMonth < 1 || lunarMonth > 12) {
    throw new Error(`Invalid lunarMonth: ${lunarMonth}, must be 1-12`);
  }
  // 正月(1)在辰(4)，顺行
  return mod(4 + lunarMonth - 1, 12);
}

/**
 * 右弼星位置计算。
 *
 * 口诀：农历月起戌逆行
 * 正月在戌(10)，二月在酉(9)，依此类推
 *
 * @param lunarMonth 农历月（1-12）
 * @returns 右弼星所在宫位索引（0-11）
 */
export function getRightAssistantPosition(lunarMonth: number): number {
  if (lunarMonth < 1 || lunarMonth > 12) {
    throw new Error(`Invalid lunarMonth: ${lunarMonth}, must be 1-12`);
  }
  // 正月(1)在戌(10)，逆行
  return mod(10 - (lunarMonth - 1), 12);
}

/**
 * 文昌星位置表（按年干）。
 *
 * 口诀：甲戌乙酉丙申宫，丁未戊午己巳同，庚辰辛卯壬寅位，癸丑文昌此中逢
 */
const WENCHANG_TABLE: Record<HeavenlyStem, number> = {
  甲: 10, // 戌
  乙: 9, // 酉
  丙: 8, // 申
  丁: 7, // 未
  戊: 6, // 午
  己: 5, // 巳
  庚: 4, // 辰
  辛: 3, // 卯
  壬: 2, // 寅
  癸: 1, // 丑
};

/**
 * 文昌星位置计算。
 *
 * @param yearStem 年干
 * @returns 文昌星所在宫位索引（0-11）
 */
export function getWenchangPosition(yearStem: HeavenlyStem): number {
  return WENCHANG_TABLE[yearStem];
}

/**
 * 文昌星位置计算（按时支）。
 *
 * 口诀：戌上逆时觅文昌
 *
 * @param timeBranch 时支
 * @returns 文昌星所在宫位索引（0-11）
 */
export function getWenchangPositionByTimeBranch(timeBranch: EarthlyBranch): number {
  return mod(10 - getBranchIndex(timeBranch), 12);
}

/**
 * 文曲星位置表（按年干）。
 *
 * 口诀：甲辰乙巳丙午宫，丁未戊申己酉同，庚戌辛亥壬子位，癸丑文曲此中逢
 */
const WENQU_TABLE: Record<HeavenlyStem, number> = {
  甲: 4, // 辰
  乙: 5, // 巳
  丙: 6, // 午
  丁: 7, // 未
  戊: 8, // 申
  己: 9, // 酉
  庚: 10, // 戌
  辛: 11, // 亥
  壬: 0, // 子
  癸: 1, // 丑
};

/**
 * 文曲星位置计算。
 *
 * @param yearStem 年干
 * @returns 文曲星所在宫位索引（0-11）
 */
export function getWenquPosition(yearStem: HeavenlyStem): number {
  return WENQU_TABLE[yearStem];
}

/**
 * 文曲星位置计算（按时支）。
 *
 * 口诀：辰上顺时觅文曲
 *
 * @param timeBranch 时支
 * @returns 文曲星所在宫位索引（0-11）
 */
export function getWenquPositionByTimeBranch(timeBranch: EarthlyBranch): number {
  return mod(4 + getBranchIndex(timeBranch), 12);
}

/**
 * 天魁星位置表（按年干）。
 *
 * 口诀：甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎
 * 天魁（阳贵）：甲戊庚-丑，乙己-子，丙丁-亥，壬癸-卯，辛-午
 */
const TIANKUI_TABLE: Record<HeavenlyStem, number> = {
  甲: 1, // 丑
  乙: 0, // 子
  丙: 11, // 亥
  丁: 11, // 亥
  戊: 1, // 丑
  己: 0, // 子
  庚: 1, // 丑
  辛: 6, // 午
  壬: 3, // 卯
  癸: 3, // 卯
};

/**
 * 天魁星位置计算。
 *
 * @param yearStem 年干
 * @returns 天魁星所在宫位索引（0-11）
 */
export function getTiankuiPosition(yearStem: HeavenlyStem): number {
  return TIANKUI_TABLE[yearStem];
}

/**
 * 天钺星位置表（按年干）。
 *
 * 口诀：甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎
 * 天钺（阴贵）：甲戊庚-未，乙己-申，丙丁-酉，壬癸-巳，辛-寅
 */
const TIANYUE_TABLE: Record<HeavenlyStem, number> = {
  甲: 7, // 未
  乙: 8, // 申
  丙: 9, // 酉
  丁: 9, // 酉
  戊: 7, // 未
  己: 8, // 申
  庚: 7, // 未
  辛: 2, // 寅
  壬: 5, // 巳
  癸: 5, // 巳
};

/**
 * 天钺星位置计算。
 *
 * @param yearStem 年干
 * @returns 天钺星所在宫位索引（0-11）
 */
export function getTianyuePosition(yearStem: HeavenlyStem): number {
  return TIANYUE_TABLE[yearStem];
}
