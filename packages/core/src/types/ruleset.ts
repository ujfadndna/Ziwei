import type { EarthlyBranch, Gender, HeavenlyStem } from "./base";
import type { PalaceIndex, PalaceName } from "./palace";
import type { Brightness, MajorStarName, MutagenType, StarName, StarType } from "./star";

/**
 * 规则集（RuleSet）相关类型定义。
 *
 * 目标：
 * - 用“数据驱动”的方式表达不同派别/版本的断语规则
 * - 同时为四化表、亮度表等配置提供统一结构
 */

/**
 * 规则类别（可用于分组、启用/禁用、统计等）。
 */
export const 规则类别 = ["星曜", "宫位", "四化", "亮度", "格局", "运限", "通用"] as const;

/**
 * Rule Category（规则类别）。
 */
export type RuleCategory = (typeof 规则类别)[number];

/**
 * 规则条件（声明式）。
 *
 * 说明：
 * - 该类型是“条件表达式 AST”，用于描述规则适用范围
 * - 真正的求值/执行逻辑由实现层（rule engine）负责
 */
export type RuleCondition =
  | RuleConditionAll
  | RuleConditionAny
  | RuleConditionNot
  | RuleConditionPredicate
  | RuleConditionCustom;

/**
 * AND 条件。
 */
export interface RuleConditionAll {
  type: "and";
  conditions: readonly RuleCondition[];
}

/**
 * OR 条件。
 */
export interface RuleConditionAny {
  type: "or";
  conditions: readonly RuleCondition[];
}

/**
 * NOT 条件。
 */
export interface RuleConditionNot {
  type: "not";
  condition: RuleCondition;
}

/**
 * 常用谓词条件。
 */
export type RuleConditionPredicate =
  | {
      type: "genderIs";
      gender: Gender;
    }
  | {
      type: "palaceIs";
      palace: PalaceName | PalaceIndex;
    }
  | {
      type: "hasStar";
      star: StarName;
      /** 限定星曜落宫（可选） */
      palace?: PalaceName | PalaceIndex;
    }
  | {
      type: "starTypeIs";
      star: StarName;
      starType: StarType;
    }
  | {
      type: "mutagenIs";
      star: StarName;
      mutagen: MutagenType;
    }
  | {
      type: "brightnessIs";
      star: StarName;
      brightness: Brightness;
    };

/**
 * 自定义条件（作为扩展逃生舱）。
 */
export interface RuleConditionCustom {
  type: "custom";
  /**
   * 自定义表达式（例如：DSL、脚本片段、或某种 key-path）。
   *
   * 注意：执行层应做好沙箱/安全控制，避免注入风险。
   */
  expr: string;
}

/**
 * 规则命中后的输出（声明式）。
 *
 * 说明：类型层不约束具体“断语”格式，允许规则引擎返回任意结构化结果。
 */
export interface RuleOutcome {
  /** 标签（可选，例如：吉/凶/桃花/科名等） */
  tags?: readonly string[];
  /** 分值（可选，用于排序/聚合） */
  score?: number;
  /** 解释文本（可选） */
  message?: string;
  /** 结构化结果（可选） */
  data?: Record<string, unknown>;
}

/**
 * 规则定义。
 */
export interface Rule {
  /** 规则唯一 ID */
  id: string;
  /** 规则名称（人类可读） */
  name: string;
  /** 类别 */
  category: RuleCategory;
  /** 描述（可选） */
  description?: string;

  /** 条件 */
  when: RuleCondition;
  /** 命中输出 */
  then: RuleOutcome;

  /** 是否启用（可选；默认由实现层约定为 true） */
  enabled?: boolean;
}

/**
 * 四化表：以天干为索引，给出四化对应的星曜。
 *
 * 示例：
 * - mutagenTable["甲"]["化禄"] = "廉贞"
 * - mutagenTable["甲"]["化权"] = "破军"
 */
export type MutagenTable = Record<HeavenlyStem, Record<MutagenType, StarName>>;

/**
 * 亮度表：以星曜为索引，再以地支（宫位）为索引给出亮度。
 *
 * 说明：
 * - 通常主星才有较完整的庙旺表；这里不强制限制星曜范围，交由配置决定
 */
export type BrightnessTable = Partial<Record<MajorStarName, Partial<Record<EarthlyBranch, Brightness>>>>;

/**
 * 规则集配置（含四化表、亮度表等）。
 */
export interface RuleSetConfig {
  /** 四化表（可选） */
  mutagenTable?: MutagenTable;
  /** 亮度表（可选） */
  brightnessTable?: BrightnessTable;

  /** 规则集默认标签（可选） */
  defaultTags?: readonly string[];

  /** 备注（可选） */
  note?: string;
}

/**
 * 规则集。
 */
export interface RuleSet {
  /** 规则集 ID（建议稳定、可持久化） */
  id: string;
  /** 规则集名称 */
  name: string;
  /** 版本（可选） */
  version?: string;

  /** 配置 */
  config: RuleSetConfig;
  /** 规则列表 */
  rules: readonly Rule[];
}
