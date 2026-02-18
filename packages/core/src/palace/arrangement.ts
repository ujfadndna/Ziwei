/**
 * 宫位排列模块。
 *
 * 核心功能：
 * - 十二宫名称定义
 * - 从命宫起逆时针排列十二宫
 * - 计算宫干（根据年干起宫干）
 */

import type { EarthlyBranch, HeavenlyStem, StemBranch } from "../types/base";
import type { Palace, PalaceIndex, PalaceName } from "../types/palace";
import { 地支, 天干 } from "../types/base";
import { 十二宫名称 } from "../types/palace";
import {
  assertIntInRange,
  getBranchIndex,
  getStemIndex,
  mod,
  required,
  stemBranchFromParts,
} from "../calendar/utils";

/**
 * 十二宫名称（按顺序）。
 * 从命宫起，逆时针排列。
 */
export const PALACE_NAMES: readonly PalaceName[] = 十二宫名称;

/**
 * 计算宫干。
 *
 * 算法：根据年干确定寅宫天干，然后从寅宫顺布到十二宫。
 *
 * 口诀（定寅首 / 年上起月同法）：
 * - 甲己年起丙寅
 * - 乙庚年起戊寅
 * - 丙辛年起庚寅
 * - 丁壬年起壬寅
 * - 戊癸年起甲寅
 *
 * @param yearStem 年干
 * @param branchIndex 地支索引（0-11，对应子到亥）
 * @returns 该宫位的天干
 */
export function getPalaceStem(yearStem: HeavenlyStem, branchIndex: number): HeavenlyStem {
  assertIntInRange(branchIndex, 0, 11, "branchIndex");
  const yearStemIndex = getStemIndex(yearStem);

  // 甲己年起丙寅；乙庚年起戊寅；丙辛年起庚寅；丁壬年起壬寅；戊癸年起甲寅
  // 复用历法中「年上起月（五虎遁）」的索引公式：yearStemIndex*2+2（0-based）
  const yinStemIndex = mod(yearStemIndex * 2 + 2, 10);

  // 从寅宫(索引2)到目标地支的偏移量
  const offset = mod(branchIndex - 2, 12);

  // 计算目标宫位的天干索引
  const targetStemIndex = mod(yinStemIndex + offset, 10);

  return required(天干[targetStemIndex], `Heavenly stem not found for index=${targetStemIndex}`);
}

/**
 * 从命宫起，逆时针排列十二宫。
 *
 * @param soulBranchIndex 命宫地支索引（0-11）
 * @param yearStem 年干（用于计算宫干）
 * @returns 十二宫数组
 */
export function arrangePalaces(soulBranchIndex: number, yearStem: HeavenlyStem): Palace[] {
  assertIntInRange(soulBranchIndex, 0, 11, "soulBranchIndex");

  const palaces: Palace[] = [];

  for (let i = 0; i < 12; i++) {
    // 逆时针排列：命宫在soulBranchIndex，兄弟在soulBranchIndex-1，以此类推
    const branchIndex = mod(soulBranchIndex - i, 12) as PalaceIndex;
    const branch = required(地支[branchIndex], `Earthly branch not found for index=${branchIndex}`);
    const stem = getPalaceStem(yearStem, branchIndex);

    // 宫干按「定寅首」顺布时，干支组合必然落在六十甲子内。
    const stemBranch: StemBranch = stemBranchFromParts(stem, branch);

    palaces.push({
      index: i as PalaceIndex,
      name: required(PALACE_NAMES[i], `Palace name not found for index=${i}`),
      stem,
      branch,
      stemBranch,
      stars: [],
    });
  }

  return palaces;
}

/**
 * 获取宫位的地支索引。
 *
 * @param palaces 十二宫数组
 * @param palaceName 宫位名称
 * @returns 地支索引
 */
export function getPalaceBranchIndex(palaces: readonly Palace[], palaceName: PalaceName): number {
  const palace = palaces.find((p) => p.name === palaceName);
  if (!palace || !palace.branch) {
    throw new Error(`Palace not found or has no branch: ${palaceName}`);
  }
  return getBranchIndex(palace.branch);
}

/**
 * 根据地支获取宫位。
 *
 * @param palaces 十二宫数组
 * @param branch 地支
 * @returns 宫位
 */
export function getPalaceByBranch(palaces: readonly Palace[], branch: EarthlyBranch): Palace {
  const palace = palaces.find((p) => p.branch === branch);
  if (!palace) {
    throw new Error(`Palace not found for branch: ${branch}`);
  }
  return palace;
}

/**
 * 计算来因宫索引。
 *
 * 口径（与主流实现保持一致）：
 * - 宫干与生年天干相同；
 * - 宫支不取子、丑。
 *
 * @param palaces 十二宫数组
 * @param yearStem 生年天干
 * @returns 来因宫索引；未命中时返回 null
 */
export function getOriginPalaceIndex(
  palaces: readonly Palace[],
  yearStem: HeavenlyStem
): PalaceIndex | null {
  const palace = palaces.find((item) => item.stem === yearStem && item.branch !== "子" && item.branch !== "丑");
  return palace?.index ?? null;
}
