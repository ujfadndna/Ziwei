/**
 * 天府系主星安星模块。
 *
 * 天府系八星：天府、太阴、贪狼、巨门、天相、天梁、七杀、破军
 * 天府定位：与紫微对称（紫微在寅，天府在戌）
 */

import type { MajorStarName } from "../../types/star";
import { mod } from "../../calendar/utils";

/** 天府系主星名称 */
export const TIANFU_SERIES_STARS: readonly MajorStarName[] = [
  "天府",
  "太阴",
  "贪狼",
  "巨门",
  "天相",
  "天梁",
  "七杀",
  "破军",
] as const;

/**
 * 根据紫微位置计算天府位置。
 *
 * 天府与紫微对称规则：
 * - 紫微在寅(2)，天府在戌(10)
 * - 紫微在卯(3)，天府在酉(9)
 * - 对称轴为子午线，公式：天府 = (4 - 紫微) mod 12
 * - 或等价：天府 = (16 - 紫微) mod 12
 *
 * @param ziweiPos 紫微星所在宫位索引（0-11）
 * @returns 天府星所在宫位索引（0-11）
 */
export function getTianfuPosition(ziweiPos: number): number {
  // 对称公式：以寅-戌为轴，紫微+天府=12（在寅戌轴上）
  // 实际对称轴在寅申之间，公式为：天府 = (4 - 紫微 + 12) mod 12
  return mod(4 - ziweiPos, 12);
}

/**
 * 天府系星曜相对天府的位置偏移。
 *
 * 天府顺行规则：天府-太阴-贪狼-巨门-天相-天梁-七杀-空-空-空-破军
 * 偏移值：天府(0), 太阴(1), 贪狼(2), 巨门(3), 天相(4), 天梁(5), 七杀(6), 破军(10)
 */
const TIANFU_SERIES_OFFSETS: Record<MajorStarName, number> = {
  // 天府系星曜
  天府: 0,
  太阴: 1,
  贪狼: 2,
  巨门: 3,
  天相: 4,
  天梁: 5,
  七杀: 6,
  破军: 10,
  // 紫微系星曜不在此表中，设为 NaN 作为标记
  紫微: NaN,
  天机: NaN,
  太阳: NaN,
  武曲: NaN,
  天同: NaN,
  廉贞: NaN,
};

/**
 * 根据天府位置计算天府系所有星曜位置。
 *
 * @param tianfuPos 天府星所在宫位索引（0-11）
 * @returns 天府系星曜位置映射
 */
export function getTianfuSeriesPositions(tianfuPos: number): Partial<Record<MajorStarName, number>> {
  const result: Partial<Record<MajorStarName, number>> = {};

  for (const star of TIANFU_SERIES_STARS) {
    const offset = TIANFU_SERIES_OFFSETS[star];
    if (!Number.isNaN(offset)) {
      result[star] = mod(tianfuPos + offset, 12);
    }
  }

  return result;
}

/**
 * 根据紫微位置计算所有十四主星位置。
 *
 * @param ziweiPos 紫微星所在宫位索引（0-11）
 * @returns 十四主星位置映射
 */
export function getAllMajorStarPositions(ziweiPos: number): Record<MajorStarName, number> {
  const tianfuPos = getTianfuPosition(ziweiPos);

  // 紫微系
  const ziweiSeries: Partial<Record<MajorStarName, number>> = {
    紫微: ziweiPos,
    天机: mod(ziweiPos - 1, 12),
    太阳: mod(ziweiPos - 3, 12),
    武曲: mod(ziweiPos - 4, 12),
    天同: mod(ziweiPos - 5, 12),
    廉贞: mod(ziweiPos - 8, 12),
  };

  // 天府系
  const tianfuSeries: Partial<Record<MajorStarName, number>> = {
    天府: tianfuPos,
    太阴: mod(tianfuPos + 1, 12),
    贪狼: mod(tianfuPos + 2, 12),
    巨门: mod(tianfuPos + 3, 12),
    天相: mod(tianfuPos + 4, 12),
    天梁: mod(tianfuPos + 5, 12),
    七杀: mod(tianfuPos + 6, 12),
    破军: mod(tianfuPos + 10, 12),
  };

  return { ...ziweiSeries, ...tianfuSeries } as Record<MajorStarName, number>;
}
