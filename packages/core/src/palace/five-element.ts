/**
 * 五行局计算模块。
 *
 * 五行局：水二局、木三局、金四局、土五局、火六局
 * 计算方法：根据命宫地支和年干推命宫干支，再查纳音五行
 */

import type { EarthlyBranch, FiveElement, HeavenlyStem } from "../types/base";
import { getBranchIndex, getNaYin, stemBranchFromParts } from "../calendar/utils";
import { getPalaceStem } from "./arrangement";

/**
 * 五行局定义。
 */
export interface FiveElementClass {
  /** 五行 */
  element: FiveElement;
  /** 局数 */
  number: 2 | 3 | 4 | 5 | 6;
  /** 名称 */
  name: string;
}

/**
 * 五行局数据。
 */
export const FIVE_ELEMENT_CLASSES = [
  { element: "水", number: 2, name: "水二局" },
  { element: "木", number: 3, name: "木三局" },
  { element: "金", number: 4, name: "金四局" },
  { element: "土", number: 5, name: "土五局" },
  { element: "火", number: 6, name: "火六局" },
] as const satisfies readonly FiveElementClass[];

const FIVE_ELEMENT_CLASS_BY_ELEMENT: Record<FiveElement, FiveElementClass> = {
  水: FIVE_ELEMENT_CLASSES[0],
  木: FIVE_ELEMENT_CLASSES[1],
  金: FIVE_ELEMENT_CLASSES[2],
  土: FIVE_ELEMENT_CLASSES[3],
  火: FIVE_ELEMENT_CLASSES[4],
};

/**
 * 根据命宫地支和年干计算五行局。
 *
 * @param soulBranch 命宫地支
 * @param yearStem 年干
 * @returns 五行局
 */
export function getFiveElementClass(soulBranch: EarthlyBranch, yearStem: HeavenlyStem): FiveElementClass {
  const branchIndex = getBranchIndex(soulBranch);

  // 1) 先定命宫宫干（定寅首顺布十二宫）
  const stem = getPalaceStem(yearStem, branchIndex);

  // 2) 命宫干支 -> 纳音五行
  const stemBranch = stemBranchFromParts(stem, soulBranch);
  const { element } = getNaYin(stemBranch);

  // 3) 纳音五行 -> 五行局（数字局）
  return FIVE_ELEMENT_CLASS_BY_ELEMENT[element];
}

/**
 * 根据五行获取对应的局数。
 *
 * @param element 五行
 * @returns 局数
 */
export function getElementNumber(element: FiveElement): 2 | 3 | 4 | 5 | 6 {
  return FIVE_ELEMENT_CLASS_BY_ELEMENT[element].number;
}
