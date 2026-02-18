/**
 * 大限计算模块。
 *
 * 大限：十年一运，根据五行局数确定起运年龄
 * 行运方向：阳男阴女顺行，阴男阳女逆行
 */

import type { EarthlyBranch, Gender, HeavenlyStem, YinYang } from "../types/base";
import type { PalaceIndex } from "../types/palace";
import { 地支, 天干 } from "../types/base";
import { mod, getStemIndex, getBranchIndex, required } from "../calendar/utils";

/**
 * 大限信息。
 */
export interface DecadalInfo {
  /** 大限所落宫位索引（0-11，对应十二地支） */
  palaceIndex: PalaceIndex;
  /** 起始年龄（虚岁） */
  startAge: number;
  /** 结束年龄（虚岁） */
  endAge: number;
  /** 大限天干 */
  stem: HeavenlyStem;
  /** 大限地支 */
  branch: EarthlyBranch;
}

/**
 * 计算大限起运年龄。
 *
 * 根据五行局数：
 * - 水二局：2岁起运
 * - 木三局：3岁起运
 * - 金四局：4岁起运
 * - 土五局：5岁起运
 * - 火六局：6岁起运
 *
 * @param fiveElementNumber 五行局数（2-6）
 * @returns 起运年龄
 */
export function getDecadalStartAge(fiveElementNumber: number): number {
  if (fiveElementNumber < 2 || fiveElementNumber > 6) {
    throw new Error(`Invalid five element number: ${fiveElementNumber}, must be 2-6`);
  }
  return fiveElementNumber;
}

/**
 * 判断大限行运方向。
 *
 * 阳男阴女顺行（+1），阴男阳女逆行（-1）
 *
 * @param gender 性别
 * @param yearStemYinYang 年干阴阳
 * @returns 1 表示顺行，-1 表示逆行
 */
export function getDecadalDirection(gender: Gender, yearStemYinYang: YinYang): 1 | -1 {
  const isYangMale = yearStemYinYang === "阳" && gender === "男";
  const isYinFemale = yearStemYinYang === "阴" && gender === "女";
  return isYangMale || isYinFemale ? 1 : -1;
}

/**
 * 获取天干的阴阳属性。
 *
 * 甲丙戊庚壬为阳，乙丁己辛癸为阴
 *
 * @param stem 天干
 * @returns 阴阳
 */
export function getStemYinYang(stem: HeavenlyStem): YinYang {
  const index = getStemIndex(stem);
  return index % 2 === 0 ? "阳" : "阴";
}

/**
 * 计算大限宫位。
 *
 * @param soulPalaceBranchIndex 命宫地支索引（0-11）
 * @param gender 性别
 * @param yearStem 年干
 * @param fiveElementNumber 五行局数（2-6）
 * @param yearStem 年干（用于计算宫干）
 * @returns 十二个大限信息数组
 */
export function getDecadalPalaces(
  soulPalaceBranchIndex: number,
  gender: Gender,
  yearStem: HeavenlyStem,
  fiveElementNumber: number
): DecadalInfo[] {
  const startAge = getDecadalStartAge(fiveElementNumber);
  const yearStemYinYang = getStemYinYang(yearStem);
  const direction = getDecadalDirection(gender, yearStemYinYang);

  const decadals: DecadalInfo[] = [];

  for (let i = 0; i < 12; i++) {
    // 大限宫位：从命宫开始，按方向移动
    const branchIndex = mod(soulPalaceBranchIndex + direction * i, 12) as PalaceIndex;
    const branch = required(地支[branchIndex], `Branch not found for index ${branchIndex}`);

    // 大限天干：根据年干起宫干的规则
    const stem = getDecadalStem(yearStem, branchIndex);

    decadals.push({
      palaceIndex: branchIndex,
      startAge: startAge + i * 10,
      endAge: startAge + i * 10 + 9,
      stem,
      branch,
    });
  }

  return decadals;
}

/**
 * 计算大限天干（与宫干计算规则相同）。
 *
 * @param yearStem 年干
 * @param branchIndex 地支索引
 * @returns 大限天干
 */
function getDecadalStem(yearStem: HeavenlyStem, branchIndex: number): HeavenlyStem {
  const yearStemIndex = getStemIndex(yearStem);
  // 甲己年起丙寅；乙庚年起戊寅；丙辛年起庚寅；丁壬年起壬寅；戊癸年起甲寅
  const yinStemIndex = mod(yearStemIndex * 2 + 2, 10);
  // 从寅宫(索引2)到目标地支的偏移量
  const offset = mod(branchIndex - 2, 12);
  const targetStemIndex = mod(yinStemIndex + offset, 10);
  return required(天干[targetStemIndex], `Stem not found for index ${targetStemIndex}`);
}

/**
 * 根据年龄查找当前大限。
 *
 * @param decadals 大限数组
 * @param age 年龄（虚岁）
 * @returns 当前大限信息，如果年龄小于起运年龄则返回 undefined
 */
export function findDecadalByAge(
  decadals: readonly DecadalInfo[],
  age: number
): DecadalInfo | undefined {
  return decadals.find((d) => age >= d.startAge && age <= d.endAge);
}
