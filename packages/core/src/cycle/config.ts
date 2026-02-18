import type { CycleConfig, ResolvedCycleConfig } from "../types/cycle";

/**
 * 运限口径预设。
 */
export interface CycleRulePreset {
  id: string;
  label: string;
  yearDivide: ResolvedCycleConfig["yearDivide"];
  smallLimitMethod: ResolvedCycleConfig["smallLimitMethod"];
  monthlyMethod: ResolvedCycleConfig["monthlyMethod"];
  note?: string;
}

const DEFAULT_PRESET_ID = "default";

const CYCLE_RULE_PRESETS: Record<string, CycleRulePreset> = {
  default: {
    id: "default",
    label: "通行版",
    yearDivide: "lichun",
    smallLimitMethod: "year-group",
    monthlyMethod: "solar-term",
    note: "以立春切年、节气月、年支起小限。",
  },
  zhongzhou: {
    id: "zhongzhou",
    label: "中州派",
    yearDivide: "lunar-year",
    smallLimitMethod: "ming-palace",
    monthlyMethod: "lunar-month",
    note: "常见于中州派口径：春节切年、农历月、命宫起小限。",
  },
};

/**
 * 获取全部内置运限口径预设。
 */
export function listCycleRulePresets(): CycleRulePreset[] {
  return Object.values(CYCLE_RULE_PRESETS);
}

/**
 * 根据规则集 ID 获取预设（未知 ID 回落到 default）。
 */
export function getCycleRulePreset(ruleSetId?: string): CycleRulePreset {
  const id = typeof ruleSetId === "string" && ruleSetId.trim() ? ruleSetId : DEFAULT_PRESET_ID;
  return CYCLE_RULE_PRESETS[id] ?? CYCLE_RULE_PRESETS[DEFAULT_PRESET_ID];
}

/**
 * 解析完整运限口径配置。
 */
export function resolveCycleConfig(ruleSetId?: string, overrides?: CycleConfig): ResolvedCycleConfig {
  const preset = getCycleRulePreset(ruleSetId);

  return {
    presetId: preset.id,
    label: preset.label,
    yearDivide: overrides?.yearDivide ?? preset.yearDivide,
    smallLimitMethod: overrides?.smallLimitMethod ?? preset.smallLimitMethod,
    monthlyMethod: overrides?.monthlyMethod ?? preset.monthlyMethod,
  };
}

