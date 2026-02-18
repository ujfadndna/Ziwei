import type { EarthlyBranch, FiveElement, Gender, HeavenlyStem, StemBranch, YinYang } from "./base";
import type { BirthInfo } from "./chart";

/**
 * 四柱中的单柱结构（年/月/日/时）。
 */
export interface Pillar {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  stemBranch: StemBranch;
}

/**
 * 十神。
 */
export type TenGod =
  | "比肩"
  | "劫财"
  | "食神"
  | "伤官"
  | "偏财"
  | "正财"
  | "七杀"
  | "正官"
  | "偏印"
  | "正印"
  | "日主";

/**
 * 地支藏干项。
 */
export interface HiddenStem {
  stem: HeavenlyStem;
  element: FiveElement;
  tenGod: TenGod;
  /**
   * 权重（MVP 默认 1，按出现次数统计）。
   */
  weight: number;
}

/**
 * 大运单步。
 */
export interface LuckPillar {
  index: number;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  stemBranch: StemBranch;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
}

/**
 * 八字规则集（MVP 固定口径）。
 */
export interface BaziRuleSet {
  yearBoundary: "lichun";
  ziHourRollover: "lateZi";
  monthPillarBy: "solarTerms";
  useTrueSolarTime: false;
  /**
   * 仅用于记录输出与 trace，不参与真太阳时换算（MVP 固定关闭）。
   */
  timezone?: string;
}

/**
 * 调试追踪步骤。
 */
export interface TraceStep {
  key: string;
  title: string;
  detail: string;
  data?: Record<string, unknown>;
}

/**
 * 八字输入。
 */
export interface BaziInput extends BirthInfo {
  /**
   * 指定流年（可选）。
   */
  flowYear?: number;
}

/**
 * 五行统计（MVP 按出现次数计数）。
 */
export type FiveElementsCount = Record<FiveElement, number>;

/**
 * 八字排盘结果。
 */
export interface BaziChart {
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  dayMaster: HeavenlyStem;
  hiddenStems: {
    yearBranch: HiddenStem[];
    monthBranch: HiddenStem[];
    dayBranch: HiddenStem[];
    hourBranch: HiddenStem[];
  };
  tenGods: {
    stems: {
      year: TenGod;
      month: TenGod;
      day: "日主";
      hour: TenGod;
    };
    hiddenStems: {
      yearBranch: HiddenStem[];
      monthBranch: HiddenStem[];
      dayBranch: HiddenStem[];
      hourBranch: HiddenStem[];
    };
  };
  fiveElementsCount: FiveElementsCount;
  luck: {
    direction: "forward" | "backward";
    startAge?: number;
    startDate?: string;
    pillars: LuckPillar[];
  };
  flow: {
    year?: {
      year: number;
      stemBranch: StemBranch;
    };
  };
  rulesApplied: {
    yearBoundary: "lichun";
    ziHourRollover: "lateZi";
    monthPillarBy: "solarTerms";
    useTrueSolarTime: false;
    timezone: string;
  };
  trace: TraceStep[];
}

/**
 * 八字起运顺逆判定中间结构。
 */
export interface LuckDirectionDecision {
  gender: Gender;
  yearStem: HeavenlyStem;
  yearStemYinYang: YinYang;
  direction: "forward" | "backward";
}
