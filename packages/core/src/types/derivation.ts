import type { PalaceIndex } from "./palace";
import type { StarName } from "./star";

/**
 * 推导过程（Derivation）追踪类型定义。
 *
 * 用途：
 * - 记录命盘推导过程中的关键步骤与中间结果
 * - 方便调试、复现与“可解释”输出
 */

/**
 * 推导步骤类型。
 */
export const 推导步骤类型 = [
  "input",
  "normalize",
  "calendar",
  "palaces",
  "stars",
  "cycles",
  "rules",
  "finalize",
] as const;

/**
 * Derivation Step Type（推导步骤类型）。
 */
export type DerivationStepType = (typeof 推导步骤类型)[number];

/**
 * 单步推导信息。
 */
export interface DerivationStep {
  /** 步骤 ID（建议唯一，用于关联/定位） */
  id: string;
  /** 步骤类型 */
  type: DerivationStepType;
  /** 人类可读描述 */
  description: string;

  /**
   * 关联宫位（可选）。
   *
   * 说明：用于标记该步骤主要作用于哪个宫位。
   */
  palaceIndex?: PalaceIndex;

  /**
   * 关联星曜（可选）。
   *
   * 说明：用于标记该步骤主要作用于哪颗星曜。
   */
  starName?: StarName;

  /** 输入快照（可选；建议保持可序列化） */
  input?: unknown;
  /** 输出快照（可选；建议保持可序列化） */
  output?: unknown;

  /** 警告（可选） */
  warnings?: readonly string[];

  /** 错误信息（可选） */
  error?: {
    message: string;
    /** 开发环境可选提供 stack；生产环境可省略以避免暴露细节 */
    stack?: string;
  };
}

/**
 * 推导追踪（完整轨迹）。
 */
export interface DerivationTrace {
  steps: readonly DerivationStep[];
  /** 全局警告（可选） */
  warnings?: readonly string[];
}
