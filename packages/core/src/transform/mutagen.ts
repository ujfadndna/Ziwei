/**
 * 四化计算模块。
 *
 * 四化：化禄、化权、化科、化忌
 * 根据天干确定哪些星曜获得四化
 */

import type { HeavenlyStem } from "../types/base";
import type { Palace } from "../types/palace";
import type { MutagenTable } from "../types/ruleset";
import type { Mutagen, MutagenSource, MutagenType, Star, StarName } from "../types/star";
import { 四化类型 } from "../types/star";

/**
 * 四化结果。
 */
export interface MutagenResult {
  /** 星曜名称 */
  star: StarName;
  /** 四化类型 */
  type: MutagenType;
}

/**
 * 默认四化表（通行版）。
 *
 * 格式：天干 -> { 化禄, 化权, 化科, 化忌 }
 */
export const DEFAULT_MUTAGEN_TABLE: MutagenTable = {
  甲: { 化禄: "廉贞", 化权: "破军", 化科: "武曲", 化忌: "太阳" },
  乙: { 化禄: "天机", 化权: "天梁", 化科: "紫微", 化忌: "太阴" },
  丙: { 化禄: "天同", 化权: "天机", 化科: "文昌", 化忌: "廉贞" },
  丁: { 化禄: "太阴", 化权: "天同", 化科: "天机", 化忌: "巨门" },
  戊: { 化禄: "贪狼", 化权: "太阴", 化科: "右弼", 化忌: "天机" },
  己: { 化禄: "武曲", 化权: "贪狼", 化科: "天梁", 化忌: "文曲" },
  庚: { 化禄: "太阳", 化权: "武曲", 化科: "太阴", 化忌: "天同" },
  辛: { 化禄: "巨门", 化权: "太阳", 化科: "文曲", 化忌: "文昌" },
  壬: { 化禄: "天梁", 化权: "紫微", 化科: "左辅", 化忌: "武曲" },
  癸: { 化禄: "破军", 化权: "巨门", 化科: "太阴", 化忌: "贪狼" },
};

/**
 * 根据天干获取四化星。
 *
 * @param stem 天干
 * @param mutagenTable 四化表（默认使用通行版）
 * @returns 四化结果数组
 */
export function getMutagens(
  stem: HeavenlyStem,
  mutagenTable: MutagenTable = DEFAULT_MUTAGEN_TABLE
): MutagenResult[] {
  const entry = mutagenTable[stem];
  return 四化类型.map((type) => ({
    star: entry[type],
    type,
  }));
}

/**
 * 为命盘中的星曜添加四化标记。
 *
 * @param palaces 十二宫数组
 * @param stem 触发四化的天干
 * @param source 四化来源（年干/宫干/大限/流年等）
 * @param mutagenTable 四化表（默认使用通行版）
 * @returns 添加四化标记后的十二宫数组（新数组，不修改原数组）
 */
export function applyMutagens(
  palaces: readonly Palace[],
  stem: HeavenlyStem,
  source: MutagenSource,
  mutagenTable: MutagenTable = DEFAULT_MUTAGEN_TABLE
): Palace[] {
  const mutagens = getMutagens(stem, mutagenTable);
  const mutagenMap = new Map<StarName, MutagenType>();
  for (const m of mutagens) {
    mutagenMap.set(m.star, m.type);
  }

  return palaces.map((palace) => {
    const newStars: Star[] = palace.stars.map((star) => {
      const mutagenType = mutagenMap.get(star.name);
      if (mutagenType) {
        const mutagen: Mutagen = {
          type: mutagenType,
          source,
          stem,
        };
        return { ...star, mutagen };
      }
      return star;
    });

    return { ...palace, stars: newStars };
  });
}

/**
 * 根据星曜名称查找四化类型。
 *
 * @param starName 星曜名称
 * @param stem 天干
 * @param mutagenTable 四化表
 * @returns 四化类型，如果该星曜在该天干下无四化则返回 undefined
 */
export function findMutagenType(
  starName: StarName,
  stem: HeavenlyStem,
  mutagenTable: MutagenTable = DEFAULT_MUTAGEN_TABLE
): MutagenType | undefined {
  const entry = mutagenTable[stem];
  for (const type of 四化类型) {
    if (entry[type] === starName) {
      return type;
    }
  }
  return undefined;
}
