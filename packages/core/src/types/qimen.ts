import type { EarthlyBranch, HeavenlyStem, StemBranch } from "./base";
import type { BirthInfo } from "./chart";

/**
 * 奇门排盘输入。
 */
export interface QimenInput extends BirthInfo {
  /**
   * 可选：显式指定时区，仅用于 trace/rulesApplied 记录。
   * 计算优先使用 datetime 自带偏移。
   */
  timezone?: string;
}

/**
 * 奇门遁甲规则集（MVP）。
 */
export interface QimenRuleSet {
  ziHourRollover: "lateZi";
  yuanSplit: "by5days";
  dunBoundary: "solstice";
  juTableId: string;
  useTrueSolarTime: false;
  timezone?: string;
}

export type QimenDunType = "yang" | "yin";
export type QimenYuan = "upper" | "middle" | "lower";

/**
 * 奇门 trace 步骤。
 */
export interface QimenTraceStep {
  key: string;
  title: string;
  detail: string;
  data?: Record<string, unknown>;
}

/**
 * 72 局表单项。
 */
export interface QimenJuTableEntry {
  solarTerm: string;
  recommendedDun: QimenDunType;
  upper: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  middle: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  lower: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

/**
 * 72 局表定义（可替换）。
 */
export interface QimenJuTableDefinition {
  id: string;
  source: string;
  description: string;
  entries: Record<string, QimenJuTableEntry>;
}

export interface QimenSolarTermInfo {
  name: string;
  index: number;
  startUtcIso: string;
  nextUtcIso: string;
  dayIndex: number;
}

export interface QimenXunInfo {
  hourStemBranch: StemBranch;
  xunName: "甲子" | "甲戌" | "甲申" | "甲午" | "甲辰" | "甲寅";
  xunShou: "戊" | "己" | "庚" | "辛" | "壬" | "癸";
  xunKongBranches: [EarthlyBranch, EarthlyBranch];
  xunKongPalaces: string[];
}

export interface QimenZhiFuZhiShiInfo {
  zhiFuSourcePalace: string;
  zhiFuPalace: string;
  zhiFuStar: string;
  zhiShiDoor: string;
  zhiShiPalace: string;
}

export interface QimenPalace {
  palace: string;
  door: string;
  star: string;
  god: string;
  diPanStem: HeavenlyStem;
  tianPanStem: HeavenlyStem;
  isZhiFu: boolean;
  isZhiShi: boolean;
  isXunKong: boolean;
}

/**
 * 时家转盘奇门命盘（MVP）。
 */
export interface QimenChart {
  input: {
    datetime: string;
    timeIndex: number;
  };
  solarTerm: QimenSolarTermInfo;
  dun: QimenDunType;
  yuan: QimenYuan;
  ju: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  xun: QimenXunInfo;
  zhiFuZhiShi: QimenZhiFuZhiShiInfo;
  palaces: Record<string, QimenPalace>;
  rulesApplied: {
    ziHourRollover: "lateZi";
    yuanSplit: "by5days";
    dunBoundary: "solstice";
    juTableId: string;
    useTrueSolarTime: false;
    timezone: string;
  };
  trace: QimenTraceStep[];
}
