/**
 * 紫微系主星安星模块。
 *
 * 紫微系六星：紫微、天机、太阳、武曲、天同、廉贞
 * 紫微定位：根据五行局数和农历日计算
 */

import type { MajorStarName } from "../../types/star";
import { mod } from "../../calendar/utils";

/** 紫微系主星名称 */
export const ZIWEI_SERIES_STARS: readonly MajorStarName[] = [
  "紫微",
  "天机",
  "太阳",
  "武曲",
  "天同",
  "廉贞",
] as const;

/**
 * 紫微星安星表。
 *
 * 索引：[局数-2][日数-1] = 紫微所在宫位索引（0-11，对应子-亥）
 * 口诀：局数除日数，商数定紫微
 *
 * 计算规则：
 * - 日数除以局数，得商和余数
 * - 商数为基础位置，余数决定调整
 * - 最终位置 = 寅宫(2) + 商数 - 调整值
 */
const ZIWEI_POSITION_TABLE: readonly (readonly number[])[] = [
  // 水二局 (局数=2)
  [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 0, 0, 1, 1, 2, 2, 3, 3, 4],
  // 木三局 (局数=3)
  [2, 1, 2, 3, 2, 3, 4, 3, 4, 5, 4, 5, 6, 5, 6, 7, 6, 7, 8, 7, 8, 9, 8, 9, 10, 9, 10, 11, 10, 11],
  // 金四局 (局数=4)
  [2, 1, 0, 2, 3, 2, 1, 3, 4, 3, 2, 4, 5, 4, 3, 5, 6, 5, 4, 6, 7, 6, 5, 7, 8, 7, 6, 8, 9, 8],
  // 土五局 (局数=5)
  [2, 1, 0, 11, 2, 3, 2, 1, 0, 3, 4, 3, 2, 1, 4, 5, 4, 3, 2, 5, 6, 5, 4, 3, 6, 7, 6, 5, 4, 7],
  // 火六局 (局数=6)
  [2, 1, 0, 11, 10, 2, 3, 2, 1, 0, 11, 3, 4, 3, 2, 1, 0, 4, 5, 4, 3, 2, 1, 5, 6, 5, 4, 3, 2, 6],
];

/**
 * 根据五行局数和农历日计算紫微星位置。
 *
 * @param fiveElementNumber 五行局数（2-6）
 * @param lunarDay 农历日（1-30）
 * @returns 紫微星所在宫位索引（0-11，对应子-亥）
 */
export function getZiweiPosition(fiveElementNumber: number, lunarDay: number): number {
  if (fiveElementNumber < 2 || fiveElementNumber > 6) {
    throw new Error(`Invalid fiveElementNumber: ${fiveElementNumber}, must be 2-6`);
  }
  if (lunarDay < 1 || lunarDay > 30) {
    throw new Error(`Invalid lunarDay: ${lunarDay}, must be 1-30`);
  }

  const tableIndex = fiveElementNumber - 2;
  const dayIndex = lunarDay - 1;
  return ZIWEI_POSITION_TABLE[tableIndex][dayIndex];
}

/**
 * 紫微系星曜相对紫微的位置偏移。
 *
 * 紫微逆行规则：紫微-天机-空-太阳-武曲-天同-空-空-廉贞
 * 偏移值：紫微(0), 天机(-1), 太阳(-3), 武曲(-4), 天同(-5), 廉贞(-8)
 */
const ZIWEI_SERIES_OFFSETS: Record<MajorStarName, number> = {
  紫微: 0,
  天机: -1,
  太阳: -3,
  武曲: -4,
  天同: -5,
  廉贞: -8,
  // 天府系星曜不在此表中，设为 NaN 作为标记
  天府: NaN,
  太阴: NaN,
  贪狼: NaN,
  巨门: NaN,
  天相: NaN,
  天梁: NaN,
  七杀: NaN,
  破军: NaN,
};

/**
 * 根据紫微位置计算紫微系所有星曜位置。
 *
 * @param ziweiPos 紫微星所在宫位索引（0-11）
 * @returns 紫微系星曜位置映射
 */
export function getZiweiSeriesPositions(ziweiPos: number): Partial<Record<MajorStarName, number>> {
  const result: Partial<Record<MajorStarName, number>> = {};

  for (const star of ZIWEI_SERIES_STARS) {
    const offset = ZIWEI_SERIES_OFFSETS[star];
    if (!Number.isNaN(offset)) {
      result[star] = mod(ziweiPos + offset, 12);
    }
  }

  return result;
}
