import type {
  DerivationStep,
  DerivationStepType,
  DerivationTrace,
} from "../types";

/**
 * 规则引用信息
 */
interface RuleReference {
  ruleId: string;
  ruleName: string;
  ruleVersion: string;
}

/**
 * 推导追踪器
 *
 * 用于记录命盘推导过程中的关键步骤与中间结果，
 * 方便调试、复现与"可解释"输出。
 */
export class DerivationTracer {
  private steps: DerivationStep[] = [];
  private warnings: string[] = [];
  private currentStep: Partial<DerivationStep> | null = null;
  private stepCounter = 0;
  private ruleSetVersion = "";
  private inputs: Record<string, unknown> = {};
  private outputs: Record<string, unknown> = {};
  private rules: RuleReference[] = [];
  private formulas: string[] = [];

  /**
   * 开始追踪
   */
  start(ruleSetVersion: string): void {
    this.ruleSetVersion = ruleSetVersion;
    this.steps = [];
    this.warnings = [];
    this.currentStep = null;
    this.stepCounter = 0;
  }

  /**
   * 开始一个步骤
   */
  beginStep(
    type: DerivationStepType,
    name: string,
    description: string
  ): void {
    if (this.currentStep) {
      this.endStep();
    }

    this.stepCounter++;
    this.inputs = {};
    this.outputs = {};
    this.rules = [];
    this.formulas = [];

    this.currentStep = {
      id: `step-${this.stepCounter}`,
      type,
      description: `[${name}] ${description}`,
      warnings: [],
    };
  }

  /**
   * 记录输入
   */
  recordInput(key: string, value: unknown): void {
    this.inputs[key] = value;
  }

  /**
   * 记录输出
   */
  recordOutput(key: string, value: unknown): void {
    this.outputs[key] = value;
  }

  /**
   * 记录使用的规则
   */
  recordRule(ruleId: string, ruleName: string, ruleVersion: string): void {
    this.rules.push({ ruleId, ruleName, ruleVersion });
  }

  /**
   * 记录计算公式/口诀
   */
  recordFormula(formula: string): void {
    this.formulas.push(formula);
  }

  /**
   * 结束当前步骤
   */
  endStep(): void {
    if (!this.currentStep) {
      return;
    }

    const input: Record<string, unknown> = { ...this.inputs };
    if (this.rules.length > 0) {
      input._rules = this.rules;
    }
    if (this.formulas.length > 0) {
      input._formulas = this.formulas;
    }

    const stepWarnings = this.currentStep.warnings as string[];
    const step: DerivationStep = {
      id: this.currentStep.id!,
      type: this.currentStep.type!,
      description: this.currentStep.description!,
      ...(Object.keys(input).length > 0 ? { input } : {}),
      ...(Object.keys(this.outputs).length > 0 ? { output: this.outputs } : {}),
      ...(stepWarnings.length > 0 ? { warnings: stepWarnings } : {}),
      ...(this.currentStep.error ? { error: this.currentStep.error } : {}),
    };

    this.steps.push(step);
    this.currentStep = null;
  }

  /**
   * 添加警告（到当前步骤或全局）
   */
  addWarning(message: string): void {
    if (this.currentStep) {
      (this.currentStep.warnings as string[]).push(message);
    } else {
      this.warnings.push(message);
    }
  }

  /**
   * 添加错误（到当前步骤）
   */
  addError(message: string): void {
    if (this.currentStep) {
      this.currentStep.error = { message };
    }
  }

  /**
   * 完成追踪，返回结果
   */
  finish(): DerivationTrace {
    if (this.currentStep) {
      this.endStep();
    }

    return {
      steps: this.steps,
      ...(this.warnings.length > 0 ? { warnings: this.warnings } : {}),
    };
  }

  /**
   * 获取当前追踪（用于中间查看）
   */
  getTrace(): DerivationTrace {
    const steps = [...this.steps];

    if (this.currentStep) {
      const input: Record<string, unknown> = { ...this.inputs };
      if (this.rules.length > 0) {
        input._rules = this.rules;
      }
      if (this.formulas.length > 0) {
        input._formulas = this.formulas;
      }

      steps.push({
        id: this.currentStep.id!,
        type: this.currentStep.type!,
        description: this.currentStep.description! + " (in progress)",
        ...(Object.keys(input).length > 0 ? { input } : {}),
        ...(Object.keys(this.outputs).length > 0 ? { output: this.outputs } : {}),
        ...((this.currentStep.warnings as string[]).length > 0
          ? { warnings: this.currentStep.warnings as string[] }
          : {}),
      });
    }

    return {
      steps,
      ...(this.warnings.length > 0 ? { warnings: this.warnings } : {}),
    };
  }

  /**
   * 获取规则集版本
   */
  getRuleSetVersion(): string {
    return this.ruleSetVersion;
  }
}

/**
 * 创建新的追踪器实例
 */
export function createTracer(): DerivationTracer {
  return new DerivationTracer();
}
