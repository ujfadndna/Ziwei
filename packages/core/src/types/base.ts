/**
 * Zi Wei Dou Shu (紫微斗数) 核心基础类型定义。
 *
 * 约定：
 * - 常量使用中文命名（便于领域阅读与校对）
 * - 类型使用英文命名（便于在 TypeScript 中引用与组合）
 */

/**
 * 天干（十天干）。
 */
export const 天干 = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

/**
 * Heavenly Stem（天干）。
 */
export type HeavenlyStem = (typeof 天干)[number];

/**
 * 地支（十二地支）。
 */
export const 地支 = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

/**
 * Earthly Branch（地支）。
 */
export type EarthlyBranch = (typeof 地支)[number];

/**
 * 五行。
 */
export const 五行 = ["木", "火", "土", "金", "水"] as const;

/**
 * Five Element（五行）。
 */
export type FiveElement = (typeof 五行)[number];

/**
 * 阴阳。
 */
export const 阴阳 = ["阴", "阳"] as const;

/**
 * Yin / Yang（阴阳）。
 */
export type YinYang = (typeof 阴阳)[number];

/**
 * 性别。
 */
export const 性别 = ["男", "女"] as const;

/**
 * Gender（性别）。
 */
export type Gender = (typeof 性别)[number];

/**
 * 六十甲子（干支组合的标准集合）。
 *
 * 说明：常用于年/月/日/时的干支记录。
 */
export const 六十甲子 = [
  "甲子",
  "乙丑",
  "丙寅",
  "丁卯",
  "戊辰",
  "己巳",
  "庚午",
  "辛未",
  "壬申",
  "癸酉",
  "甲戌",
  "乙亥",
  "丙子",
  "丁丑",
  "戊寅",
  "己卯",
  "庚辰",
  "辛巳",
  "壬午",
  "癸未",
  "甲申",
  "乙酉",
  "丙戌",
  "丁亥",
  "戊子",
  "己丑",
  "庚寅",
  "辛卯",
  "壬辰",
  "癸巳",
  "甲午",
  "乙未",
  "丙申",
  "丁酉",
  "戊戌",
  "己亥",
  "庚子",
  "辛丑",
  "壬寅",
  "癸卯",
  "甲辰",
  "乙巳",
  "丙午",
  "丁未",
  "戊申",
  "己酉",
  "庚戌",
  "辛亥",
  "壬子",
  "癸丑",
  "甲寅",
  "乙卯",
  "丙辰",
  "丁巳",
  "戊午",
  "己未",
  "庚申",
  "辛酉",
  "壬戌",
  "癸亥",
] as const;

/**
 * Stem-Branch（干支组合，六十甲子）。
 */
export type StemBranch = (typeof 六十甲子)[number];

/**
 * 干支的拆分表达（便于在推导过程中分别处理天干/地支）。
 */
export interface StemBranchParts {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
}

/**
 * 时辰索引。
 *
 * - 0-11 通常对应：子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥（顺序同地支）
 * - 12 作为“占位/不详/特殊处理”的保留值（例如跨子时、未知出生时辰等业务场景）
 */
export const 时辰索引 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/**
 * Time Index（时辰索引，0-12）。
 */
export type TimeIndex = (typeof 时辰索引)[number];

/**
 * 时辰对应的地支（仅覆盖 TimeIndex=0..11）。
 */
export const 时辰地支 = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

/**
 * Time Branch（时辰地支）。
 */
export type TimeBranch = (typeof 时辰地支)[number];
