/**
 * 规则注册表 - 管理规则和规则集的注册与查询。
 */

import type { Rule, RuleCategory, RuleSet } from "../types";

/**
 * 规则注册表。
 *
 * 提供规则和规则集的注册、查询功能。
 */
class RuleRegistry {
  private rules: Map<string, Rule> = new Map();
  private ruleSets: Map<string, RuleSet> = new Map();

  /**
   * 注册单条规则。
   */
  registerRule(rule: Rule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with id "${rule.id}" already registered`);
    }
    this.rules.set(rule.id, rule);
  }

  /**
   * 批量注册规则。
   */
  registerRules(rules: readonly Rule[]): void {
    for (const rule of rules) {
      this.registerRule(rule);
    }
  }

  /**
   * 注册规则集。
   */
  registerRuleSet(ruleSet: RuleSet): void {
    if (this.ruleSets.has(ruleSet.id)) {
      throw new Error(`RuleSet with id "${ruleSet.id}" already registered`);
    }
    this.ruleSets.set(ruleSet.id, ruleSet);
    // 同时注册规则集中的所有规则
    for (const rule of ruleSet.rules) {
      if (!this.rules.has(rule.id)) {
        this.rules.set(rule.id, rule);
      }
    }
  }

  /**
   * 获取规则。
   */
  getRule(id: string): Rule | undefined {
    return this.rules.get(id);
  }

  /**
   * 获取规则集。
   */
  getRuleSet(id: string): RuleSet | undefined {
    return this.ruleSets.get(id);
  }

  /**
   * 按类别获取规则。
   */
  getRulesByCategory(category: RuleCategory): Rule[] {
    return Array.from(this.rules.values()).filter((r) => r.category === category);
  }

  /**
   * 获取所有规则。
   */
  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 获取所有规则集。
   */
  getAllRuleSets(): RuleSet[] {
    return Array.from(this.ruleSets.values());
  }

  /**
   * 检查规则是否存在。
   */
  hasRule(id: string): boolean {
    return this.rules.has(id);
  }

  /**
   * 检查规则集是否存在。
   */
  hasRuleSet(id: string): boolean {
    return this.ruleSets.has(id);
  }

  /**
   * 移除规则。
   */
  removeRule(id: string): boolean {
    return this.rules.delete(id);
  }

  /**
   * 移除规则集。
   */
  removeRuleSet(id: string): boolean {
    return this.ruleSets.delete(id);
  }

  /**
   * 清空所有注册。
   */
  clear(): void {
    this.rules.clear();
    this.ruleSets.clear();
  }
}

/**
 * 全局规则注册表实例。
 */
export const ruleRegistry = new RuleRegistry();

export { RuleRegistry };
