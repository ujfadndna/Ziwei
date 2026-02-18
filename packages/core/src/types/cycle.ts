import type { StemBranch } from "./base";
import type { PalaceIndex } from "./palace";

/**
 * 运限（大限/流年/流月/流日）相关类型定义。
 */

/**
 * 年界口径（年柱/运限年切分）。
 *
 * - `lichun`：以立春为界（常见干支口径）
 * - `lunar-year`：以农历正月初一（春节）为界
 */
export const 年界口径 = ["lichun", "lunar-year"] as const;

/**
 * 年界口径类型。
 */
export type YearDivideMethod = (typeof 年界口径)[number];

/**
 * 小限起宫口径。
 *
 * - `year-group`：按生年地支分组起限（通行口径）
 * - `ming-palace`：命宫起限（部分流派）
 */
export const 小限起宫口径 = ["year-group", "ming-palace"] as const;

/**
 * 小限起宫口径类型。
 */
export type SmallLimitMethod = (typeof 小限起宫口径)[number];

/**
 * 流月口径。
 *
 * - `solar-term`：节气月（以“节”入月）
 * - `lunar-month`：农历月
 */
export const 流月口径 = ["solar-term", "lunar-month"] as const;

/**
 * 流月口径类型。
 */
export type MonthlyMethod = (typeof 流月口径)[number];

/**
 * 运限/历法口径配置（可部分覆盖）。
 */
export interface CycleConfig {
  /** 年界口径 */
  yearDivide?: YearDivideMethod;
  /** 小限起宫口径 */
  smallLimitMethod?: SmallLimitMethod;
  /** 流月口径 */
  monthlyMethod?: MonthlyMethod;
}

/**
 * 解析后的完整口径配置。
 */
export interface ResolvedCycleConfig {
  /** 规则预设 ID（例如：default / zhongzhou） */
  presetId: string;
  /** 预设名称（用于 UI 展示） */
  label: string;
  /** 年界口径 */
  yearDivide: YearDivideMethod;
  /** 小限起宫口径 */
  smallLimitMethod: SmallLimitMethod;
  /** 流月口径 */
  monthlyMethod: MonthlyMethod;
}

/**
 * 运限类型。
 *
 * 说明：用英文值便于作为判别字段（discriminant）使用。
 */
export const 运限类型 = ["decadal", "yearly", "monthly", "daily"] as const;

/**
 * Cycle Type（运限类型）。
 */
export type CycleType = (typeof 运限类型)[number];

/**
 * 大限（十年运）。
 */
export interface Decadal {
  type: "decadal";
  /** 大限起始年龄（通常为虚岁；具体口径由实现层约定） */
  fromAge: number;
  /** 大限结束年龄（通常为虚岁；具体口径由实现层约定） */
  toAge: number;
  /** 大限所落宫位 */
  palaceIndex: PalaceIndex;
  /** 大限干支（可选；不同算法/派别可能不计算或不展示） */
  stemBranch?: StemBranch;
  /** 备注（可选） */
  note?: string;
}

/**
 * 流年（一年运）。
 */
export interface Yearly {
  type: "yearly";
  /** 公历年份（或推盘口径年份；由实现层约定） */
  year: number;
  /** 流年所落宫位（可选） */
  palaceIndex?: PalaceIndex;
  /** 流年干支（可选） */
  stemBranch?: StemBranch;
  /** 备注（可选） */
  note?: string;
}

/**
 * 流月（一月运）。
 */
export interface Monthly {
  type: "monthly";
  /** 对应的年份（可选；用于定位某一年的某一月） */
  year?: number;
  /** 月份（1-12；若使用农历月份亦可复用该字段，由实现层定义口径） */
  month: number;
  /** 流月所落宫位（可选） */
  palaceIndex?: PalaceIndex;
  /** 流月干支（可选） */
  stemBranch?: StemBranch;
  /** 备注（可选） */
  note?: string;
}

/**
 * 流日（单日运）。
 */
export interface Daily {
  type: "daily";
  /**
   * 日期字符串（推荐 ISO-8601，例如 2026-02-14）。
   *
   * 说明：具体时区/历法由实现层决定；类型层仅约束为字符串。
   */
  date: string;
  /** 流日所落宫位（可选） */
  palaceIndex?: PalaceIndex;
  /** 流日干支（可选） */
  stemBranch?: StemBranch;
  /** 备注（可选） */
  note?: string;
}

/**
 * 单个运限的联合类型。
 */
export type Cycle = Decadal | Yearly | Monthly | Daily;

/**
 * 完整运限（可同时包含多个层级）。
 */
export interface Horoscope {
  /** 大限（可选） */
  decadal?: Decadal;
  /** 流年（可选） */
  yearly?: Yearly;
  /** 流月（可选） */
  monthly?: Monthly;
  /** 流日（可选） */
  daily?: Daily;
}
