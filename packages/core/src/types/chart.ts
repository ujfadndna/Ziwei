import type { Gender, StemBranch, TimeIndex } from "./base";
import type { Horoscope, ResolvedCycleConfig } from "./cycle";
import type { DerivationTrace } from "./derivation";
import type { Palace, PalaceIndex } from "./palace";

/**
 * 命盘（Chart）相关类型定义：出生信息、日期信息、命盘结构。
 */

/**
 * 出生地信息（可选）。
 *
 * 说明：在涉及真太阳时、时区修正等场景时可能用到。
 */
export interface BirthLocation {
  /** 地点名称（可选，例如：北京/上海） */
  name?: string;
  /** 纬度（可选，WGS84） */
  latitude?: number;
  /** 经度（可选，WGS84） */
  longitude?: number;
  /** IANA 时区（可选，例如：Asia/Shanghai） */
  timeZone?: string;
}

/**
 * 出生信息（输入层数据）。
 */
export interface BirthInfo {
  /** 性别 */
  gender: Gender;

  /**
   * 出生时间（推荐 ISO-8601 字符串，例如：1990-01-01T08:00:00+08:00）。
   *
   * 说明：类型层不强制具体格式，但建议保持可序列化/可比较。
   */
  datetime: string;

  /**
   * 时辰索引（0-12）。
   *
   * 说明：0-11 通常对应子-亥；12 用于占位/不详等特殊情况。
   */
  timeIndex: TimeIndex;
  /** 用户原始选择的民用时辰（真太阳时修正前）。缺省时等同于 timeIndex。 */
  civilTimeIndex?: TimeIndex;

  /** 出生地（可选） */
  location?: BirthLocation;

  /** 备注（可选） */
  note?: string;
}

/**
 * 阳历日期信息（公历）。
 */
export interface SolarDate {
  year: number;
  /** 月（1-12） */
  month: number;
  /** 日（1-31） */
  day: number;
}

/**
 * 农历日期信息。
 */
export interface LunarDate {
  year: number;
  /** 月（1-12） */
  month: number;
  /** 日（1-30） */
  day: number;
  /** 是否闰月 */
  isLeap: boolean;
  /**
   * 是否闰月（可选）。
   *
   * @deprecated 请使用 `isLeap`。
   */
  isLeapMonth?: boolean;
}

/**
 * 干支日期信息（年/月/日/时）。
 */
export interface GanzhiDate {
  year: StemBranch;
  month: StemBranch;
  day: StemBranch;
  /** 时干支（可选；若出生时辰不详，可不提供） */
  time?: StemBranch;
}

/**
 * 日期信息（含阳历/农历/干支）。
 */
export interface DateInfo {
  solar: SolarDate;
  lunar: LunarDate;
  ganzhi: GanzhiDate;
}

/**
 * 命盘结构（完整结构）。
 */
export interface Chart {
  /** 出生信息 */
  birth: BirthInfo;
  /** 日期信息（阳历/农历/干支） */
  date: DateInfo;

  /**
   * 十二宫。
   *
   * 约定：数组长度为 12，索引与 `PalaceIndex(0-11)` 一致。
   */
  palaces: readonly Palace[];

  /** 命宫索引 */
  mingPalaceIndex: PalaceIndex;

  /** 身宫索引（可选） */
  bodyPalaceIndex?: PalaceIndex;

  /** 来因宫索引（可选） */
  originPalaceIndex?: PalaceIndex;

  /** 运限（可选） */
  horoscope?: Horoscope;

  /** 生效的运限口径配置（可选） */
  cycleConfig?: ResolvedCycleConfig;

  /** 推导追踪（可选；用于调试/可解释性） */
  trace?: DerivationTrace;

  /** 使用的规则集 ID/版本（可选） */
  ruleSetId?: string;

  /** 自定义扩展字段（可选） */
  meta?: Record<string, unknown>;
}
