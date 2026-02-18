/**
 * 流年计算模块。
 *
 * 流年：一年一运，流年地支所在宫位为流年命宫
 */

import type { EarthlyBranch, HeavenlyStem } from "../types/base";
import type { MutagenTable } from "../types/ruleset";
import type { StarName } from "../types/star";
import { getBranchIndex } from "../calendar/utils";
import { getMutagens, DEFAULT_MUTAGEN_TABLE, type MutagenResult } from "../transform/mutagen";

/**
 * 流年星曜位置。
 */
export interface StarPosition {
  /** 星曜名称 */
  name: StarName;
  /** 宫位索引（0-11） */
  palaceIndex: number;
}

/**
 * 计算流年命宫位置。
 *
 * 流年地支所在宫位即为流年命宫。
 *
 * @param yearBranch 流年地支
 * @returns 流年命宫的宫位索引（0-11）
 */
export function getYearlyPalaceIndex(yearBranch: EarthlyBranch): number {
  return getBranchIndex(yearBranch);
}

/**
 * 计算流年四化。
 *
 * @param yearStem 流年天干
 * @param mutagenTable 四化表（默认使用通行版）
 * @returns 流年四化结果数组
 */
export function getYearlyMutagens(
  yearStem: HeavenlyStem,
  mutagenTable: MutagenTable = DEFAULT_MUTAGEN_TABLE
): MutagenResult[] {
  return getMutagens(yearStem, mutagenTable);
}

/**
 * 流年星曜表。
 *
 * 太岁：流年地支所在宫位
 * 岁破：太岁对宫（+6）
 */
const YEARLY_STAR_OFFSETS: Record<string, number> = {
  太岁: 0,
  岁破: 6,
  龙德: 5,
  白虎: 6,
  天德: 9,
  吊客: 10,
  病符: 11,
};

/**
 * 计算流年星曜位置。
 *
 * @param yearBranch 流年地支
 * @returns 流年星曜位置数组
 */
export function getYearlyStars(yearBranch: EarthlyBranch): StarPosition[] {
  const baseIndex = getBranchIndex(yearBranch);
  const stars: StarPosition[] = [];

  for (const [name, offset] of Object.entries(YEARLY_STAR_OFFSETS)) {
    stars.push({
      name: name as StarName,
      palaceIndex: (baseIndex + offset) % 12,
    });
  }

  return stars;
}

/**
 * 计算流年十二宫位置。
 *
 * 流年命宫在流年地支所在宫位，其余宫位逆时针排列。
 *
 * @param yearBranch 流年地支
 * @returns 流年十二宫的宫位索引数组（索引0为命宫，索引1为兄弟...）
 */
export function getYearlyPalaceIndices(yearBranch: EarthlyBranch): number[] {
  const soulIndex = getBranchIndex(yearBranch);
  const indices: number[] = [];

  for (let i = 0; i < 12; i++) {
    // 逆时针排列
    indices.push((soulIndex - i + 12) % 12);
  }

  return indices;
}
