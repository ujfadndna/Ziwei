import type { EarthlyBranch, FiveElement, HeavenlyStem, StemBranch, YinYang } from "./base";
import type { BirthInfo, GanzhiDate, LunarDate, SolarDate } from "./chart";

/**
 * 六爻（文王纳甲）起卦：单枚硬币面值。
 */
export type CoinFace = "heads" | "tails";

/**
 * 单爻三枚硬币结果（按一次起爻的三枚硬币）。
 */
export type CoinThreeThrow = readonly [CoinFace, CoinFace, CoinFace];

/**
 * 六神。
 */
export type SixSpirit = "青龙" | "朱雀" | "勾陈" | "腾蛇" | "白虎" | "玄武";

/**
 * 六亲（相对卦宫五行）。
 */
export type LiuQin = "兄弟" | "子孙" | "妻财" | "官鬼" | "父母";

/**
 * 六爻单线信息（基础阴阳+动静）。
 */
export interface Line {
  yinYang: YinYang;
  moving: boolean;
  /**
   * 1=初爻（最下），6=上爻（最上）。
   */
  lineIndex: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * 卦基础信息（64卦表驱动）。
 */
export interface Hexagram {
  /**
   * 文王序号（1..64）。
   */
  id: number;
  name: string;
  upperTrigram: "乾" | "兑" | "离" | "震" | "巽" | "坎" | "艮" | "坤";
  lowerTrigram: "乾" | "兑" | "离" | "震" | "巽" | "坎" | "艮" | "坤";
  palace: "乾" | "兑" | "离" | "震" | "巽" | "坎" | "艮" | "坤";
  shiLine: 1 | 2 | 3 | 4 | 5 | 6;
  yingLine: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * 单爻纳甲信息（用于本卦/变卦显示）。
 */
export interface NajiaLineInfo {
  branch: EarthlyBranch;
  element: FiveElement;
  relative: LiuQin;
  spirit: SixSpirit;
  isVoid: boolean;
  markers: string[];
}

/**
 * 六爻图中的单爻（本卦/变卦并排所需信息）。
 */
export interface LiuyaoChartLine {
  line: Line;
  changedYinYang: YinYang;
  base: NajiaLineInfo;
  changed: NajiaLineInfo;
  coinThrow: CoinThreeThrow;
  coinSum: 6 | 7 | 8 | 9;
  castLabel: "老阴" | "少阳" | "少阴" | "老阳";
}

/**
 * 六爻输入。
 */
export interface LiuyaoInput extends BirthInfo {
  /**
   * 可选：显式指定时区，仅用于 trace/rulesApplied 记录。
   * 计算优先使用 datetime 自带偏移。
   */
  timezone?: string;
  casting?: {
    method?: "coin_3";
    /**
     * 6条爻位（自下而上），每条3枚硬币。
     */
    lineThrows?: readonly CoinThreeThrow[];
    /**
     * 若不传 lineThrows，可传 seed 生成确定性投掷序列。
     */
    seed?: number;
  };
}

/**
 * 六爻规则集（MVP 固定口径）。
 */
export interface LiuyaoRuleSet {
  ziHourRollover: "lateZi";
  castingMethod: "coin_3";
  najiaTableId: string;
  shiYingTableId: string;
  sixSpiritsRule: string;
  xunkongRule: string;
  timezone?: string;
}

/**
 * 六爻 trace 步骤。
 */
export interface LiuyaoTraceStep {
  key: string;
  title: string;
  detail: string;
  data?: Record<string, unknown>;
}

/**
 * 六爻排盘结果。
 */
export interface LiuyaoChart {
  input: {
    datetime: string;
    timeIndex: number;
  };
  baseHexagram: Hexagram;
  changedHexagram: Hexagram;
  lines: LiuyaoChartLine[];
  lunarInfo: {
    solar: SolarDate;
    lunar: LunarDate;
    ganzhi: GanzhiDate;
    monthBuild: EarthlyBranch;
    dayChen: EarthlyBranch;
    timezone: string;
    dstHint: boolean | null;
  };
  xunkong: {
    dayStemBranch: StemBranch;
    xun: "甲子" | "甲戌" | "甲申" | "甲午" | "甲辰" | "甲寅";
    voidBranches: readonly [EarthlyBranch, EarthlyBranch];
  };
  rulesApplied: {
    ziHourRollover: "lateZi";
    castingMethod: "coin_3";
    najiaTableId: string;
    shiYingTableId: string;
    sixSpiritsRule: string;
    xunkongRule: string;
    timezone: string;
  };
  trace: LiuyaoTraceStep[];
}

/**
 * 与占筮内部表配套的卦码（6位，按自下而上）。
 */
export type HexagramCode = string;
