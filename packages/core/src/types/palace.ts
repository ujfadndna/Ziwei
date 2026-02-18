import type { EarthlyBranch, HeavenlyStem, StemBranch } from "./base";
import type { Horoscope } from "./cycle";
import type { Star } from "./star";

/**
 * 宫位相关类型定义（十二宫、索引、三方四正等）。
 */

/**
 * 十二宫名称。
 */
export const 十二宫名称 = [
  "命宫",
  "兄弟",
  "夫妻",
  "子女",
  "财帛",
  "疾厄",
  "迁移",
  "仆役",
  "官禄",
  "田宅",
  "福德",
  "父母",
] as const;

/**
 * Palace Name（十二宫名称）。
 */
export type PalaceName = (typeof 十二宫名称)[number];

/**
 * 宫位索引（0-11）。
 *
 * 约定：与 `palaces: Palace[]` 数组下标一致。
 */
export const 宫位索引 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/**
 * Palace Index（宫位索引 0-11）。
 */
export type PalaceIndex = (typeof 宫位索引)[number];

/**
 * 三方四正（用于描述某宫位的“对宫 + 三合宫位”等围绕关系）。
 *
 * 说明（常用口径）：
 * - 三方：指本宫的两组“三合”宫位 + 对宫（共三个方向，不含本宫）
 * - 四正：指本宫 + 三方（共四宫位）
 */
export interface SurroundedPalaces {
  /** 本宫 */
  self: PalaceIndex;
  /** 对宫（与本宫相对的宫位，通常相隔 6 宫） */
  opposite: PalaceIndex;
  /** 三方（不含本宫）：两组三合宫位 + 对宫 */
  sanFang: readonly [PalaceIndex, PalaceIndex, PalaceIndex];
  /** 四正（含本宫）：本宫 + 三方 */
  siZheng: readonly [PalaceIndex, PalaceIndex, PalaceIndex, PalaceIndex];
}

/**
 * 宫位定义。
 */
export interface Palace {
  /** 宫位索引（0-11） */
  index: PalaceIndex;
  /** 宫位名称 */
  name: PalaceName;

  /**
   * 宫干（可选）。
   *
   * 说明：宫干常用于“宫干四化”等推导。
   */
  stem?: HeavenlyStem;

  /**
   * 宫支（可选）。
   *
   * 说明：宫支通常与宫位在盘面上的位置/地支对应。
   */
  branch?: EarthlyBranch;

  /**
   * 宫位干支（可选；便于展示/序列化）。
   */
  stemBranch?: StemBranch;

  /**
   * 星曜列表（主星/辅星/杂曜等）。
   */
  stars: readonly Star[];

  /**
   * 三方四正（可选；通常可由 index 推导，这里用于缓存/显式表达）。
   */
  surrounded?: SurroundedPalaces;

  /**
   * 运限信息（可选；用于将大限/流年等落宫信息与本宫绑定）。
   */
  cycles?: Horoscope;

  /**
   * 自定义扩展字段（可选；用于不同派别/规则集扩展）。
   */
  meta?: Record<string, unknown>;
}
