/**
 * 规则执行器 - 执行规则条件判断和结果输出。
 */

import type {
  BirthInfo,
  Chart,
  DateInfo,
  Rule,
  RuleCondition,
  RuleOutcome,
  RuleSet,
} from "../types";
import { ruleRegistry } from "./registry";

/**
 * 规则执行上下文。
 */
export interface RuleContext {
  /** 出生信息 */
  birthInfo: BirthInfo;
  /** 日期信息 */
  dateInfo: DateInfo;
  /** 命盘（可选，部分构建中） */
  chart?: Partial<Chart>;
  /** 扩展字段 */
  [key: string]: unknown;
}

/**
 * 规则执行结果。
 */
export interface RuleExecutionResult {
  /** 规则 ID */
  ruleId: string;
  /** 是否命中 */
  matched: boolean;
  /** 命中输出（仅当 matched=true） */
  outcome?: RuleOutcome;
}

/**
 * 规则集执行结果。
 */
export interface RuleSetExecutionResult {
  /** 规则集 ID */
  ruleSetId: string;
  /** 各规则执行结果 */
  results: RuleExecutionResult[];
  /** 命中的规则数 */
  matchedCount: number;
}

/**
 * 规则执行器。
 */
class RuleExecutor {
  /**
   * 执行单条规则。
   */
  execute(rule: Rule, context: RuleContext): RuleExecutionResult {
    // 检查规则是否启用
    if (rule.enabled === false) {
      return { ruleId: rule.id, matched: false };
    }

    const matched = this.evaluateCondition(rule.when, context);
    if (!matched) {
      return { ruleId: rule.id, matched: false };
    }

    return { ruleId: rule.id, matched: true, outcome: rule.then };
  }

  /**
   * 执行规则集。
   */
  executeRuleSet(ruleSetId: string, context: RuleContext): RuleSetExecutionResult {
    const ruleSet = ruleRegistry.getRuleSet(ruleSetId);
    if (!ruleSet) {
      throw new Error(`RuleSet "${ruleSetId}" not found`);
    }

    return this.executeRuleSetDirect(ruleSet, context);
  }

  /**
   * 直接执行规则集对象。
   */
  executeRuleSetDirect(ruleSet: RuleSet, context: RuleContext): RuleSetExecutionResult {
    const results: RuleExecutionResult[] = [];
    let matchedCount = 0;

    for (const rule of ruleSet.rules) {
      const result = this.execute(rule, context);
      results.push(result);
      if (result.matched) {
        matchedCount++;
      }
    }

    return {
      ruleSetId: ruleSet.id,
      results,
      matchedCount,
    };
  }

  /**
   * 评估条件表达式。
   */
  private evaluateCondition(condition: RuleCondition, context: RuleContext): boolean {
    switch (condition.type) {
      case "and":
        return condition.conditions.every((c) => this.evaluateCondition(c, context));

      case "or":
        return condition.conditions.some((c) => this.evaluateCondition(c, context));

      case "not":
        return !this.evaluateCondition(condition.condition, context);

      case "genderIs":
        return context.birthInfo.gender === condition.gender;

      case "palaceIs":
        return this.evaluatePalaceIs(condition.palace, context);

      case "hasStar":
        return this.evaluateHasStar(condition.star, condition.palace, context);

      case "starTypeIs":
        return this.evaluateStarTypeIs(condition.star, condition.starType, context);

      case "mutagenIs":
        return this.evaluateMutagenIs(condition.star, condition.mutagen, context);

      case "brightnessIs":
        return this.evaluateBrightnessIs(condition.star, condition.brightness, context);

      case "custom":
        return this.evaluateCustom(condition.expr, context);

      default:
        return false;
    }
  }

  /**
   * 评估宫位条件。
   */
  private evaluatePalaceIs(
    palace: string | number,
    context: RuleContext
  ): boolean {
    if (!context.chart?.palaces) return false;

    if (typeof palace === "number") {
      return palace >= 0 && palace < context.chart.palaces.length;
    }

    return context.chart.palaces.some((p) => p.name === palace);
  }

  /**
   * 评估星曜存在条件。
   */
  private evaluateHasStar(
    starName: string,
    palace: string | number | undefined,
    context: RuleContext
  ): boolean {
    if (!context.chart?.palaces) return false;

    const palaces = context.chart.palaces;

    if (palace === undefined) {
      // 检查任意宫位是否有该星
      return palaces.some((p) => p.stars?.some((s) => s.name === starName));
    }

    // 检查指定宫位
    let targetPalace;
    if (typeof palace === "number") {
      targetPalace = palaces[palace];
    } else {
      targetPalace = palaces.find((p) => p.name === palace);
    }

    return targetPalace?.stars?.some((s) => s.name === starName) ?? false;
  }

  /**
   * 评估星曜类型条件。
   */
  private evaluateStarTypeIs(
    starName: string,
    starType: string,
    context: RuleContext
  ): boolean {
    if (!context.chart?.palaces) return false;

    for (const palace of context.chart.palaces) {
      const star = palace.stars?.find((s) => s.name === starName);
      if (star && star.type === starType) {
        return true;
      }
    }
    return false;
  }

  /**
   * 评估四化条件。
   */
  private evaluateMutagenIs(
    starName: string,
    mutagenType: string,
    context: RuleContext
  ): boolean {
    if (!context.chart?.palaces) return false;

    for (const palace of context.chart.palaces) {
      const star = palace.stars?.find((s) => s.name === starName);
      if (star?.mutagen?.type === mutagenType) {
        return true;
      }
    }
    return false;
  }

  /**
   * 评估亮度条件。
   */
  private evaluateBrightnessIs(
    starName: string,
    brightness: string,
    context: RuleContext
  ): boolean {
    if (!context.chart?.palaces) return false;

    for (const palace of context.chart.palaces) {
      const star = palace.stars?.find((s) => s.name === starName);
      if (star?.brightness === brightness) {
        return true;
      }
    }
    return false;
  }

  /**
   * 评估自定义条件。
   *
   * 注意：当前实现仅支持简单表达式，复杂场景需扩展。
   */
  private evaluateCustom(expr: string, context: RuleContext): boolean {
    // 安全考虑：不使用 eval，仅支持预定义的表达式模式
    // 可扩展为 DSL 解析器

    // 示例：支持 "context.birthInfo.gender === '男'" 格式
    if (expr.startsWith("context.")) {
      try {
        const [left, right] = expr.split("===");
        if (!left || !right) return false;

        const path = left.trim().replace("context.", "");
        const expected = right.trim().replace(/['"]/g, "");
        const value = this.getNestedValue(context, path);
        return value === expected;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * 获取嵌套属性值。
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce((acc: unknown, key) => {
      if (acc && typeof acc === "object") {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }
}

/**
 * 全局规则执行器实例。
 */
export const ruleExecutor = new RuleExecutor();

export { RuleExecutor };
