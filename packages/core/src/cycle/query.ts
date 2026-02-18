import type { Chart } from "../types/chart";
import type { EarthlyBranch, HeavenlyStem } from "../types/base";
import type { PalaceIndex } from "../types/palace";
import type { MutagenResult } from "../transform/mutagen";

import { getStemBranch, parseStemBranch } from "../calendar";
import type { DecadalInfo } from "./decadal";
import { getCycleRulePreset, type CycleRulePreset } from "./config";
import { getMonthlyStemBranch, getSmallLimitPalaceIndex, getYearStemBranchByDivide } from "./runtime";
import { getYearlyMutagens, getYearlyPalaceIndex, getYearlyStars, type StarPosition } from "./yearly";

/**
 * 运限中的大限概览条目。
 */
export interface DecadalOverviewItem {
  index: number;
  startAge: number;
  endAge: number;
  palaceIndex: number;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
}

/**
 * 单年运限行（大限/小限/流年）。
 */
export interface CycleYearRow {
  age: number;
  year: number;
  decadalIndex: number | null;
  decadalPalaceIndex: number | null;
  smallLimitPalaceIndex: number;
  yearlyPalaceIndex: number;
  yearStem: HeavenlyStem;
  yearBranch: EarthlyBranch;
  yearlyMutagens: MutagenResult[];
  yearlyStars: StarPosition[];
}

/**
 * 流月行。
 */
export interface MonthlyCycleRow {
  year: number;
  month: number;
  day: number;
  hour: number;
  monthStem: HeavenlyStem;
  monthBranch: EarthlyBranch;
  monthlyPalaceIndex: number;
  monthlyMutagens: MutagenResult[];
}

/**
 * 流日行。
 */
export interface DailyCycleRow {
  year: number;
  month: number;
  day: number;
  hour: number;
  dayStem: HeavenlyStem;
  dayBranch: EarthlyBranch;
  dailyPalaceIndex: number;
  dailyMutagens: MutagenResult[];
}

/**
 * 流时行。
 */
export interface HourlyCycleRow {
  year: number;
  month: number;
  day: number;
  hour: number;
  hourStem: HeavenlyStem;
  hourBranch: EarthlyBranch;
  hourlyPalaceIndex: number;
  hourlyMutagens: MutagenResult[];
}

/**
 * 统一运限快照。
 */
export interface CycleSnapshot {
  decadals: DecadalOverviewItem[];
  yearly: CycleYearRow | null;
  monthly: MonthlyCycleRow | null;
  daily: DailyCycleRow | null;
  hourly: HourlyCycleRow | null;
  preset: CycleRulePreset;
}

/**
 * 年度对比结果（用于展示“变化”）。
 */
export interface YearlyComparison {
  previousAge: number;
  currentAge: number;
  previousYear: number;
  currentYear: number;
  smallLimit: { from: number; to: number; changed: boolean };
  yearlyPalace: { from: number; to: number; changed: boolean };
  decadalPalace: { from: number | null; to: number | null; changed: boolean };
  mutagens: { from: string; to: string; changed: boolean };
}

/**
 * 输入日期时间。
 */
export interface CycleDateTimeInput {
  year: number;
  month: number;
  day: number;
  hour: number;
}

export type CycleQueryInput = CycleDateTimeInput & { age: number };

function isDecadalInfo(value: unknown): value is DecadalInfo {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  return (
    Number.isInteger(data.palaceIndex) &&
    Number.isInteger(data.startAge) &&
    Number.isInteger(data.endAge) &&
    typeof data.stem === "string" &&
    typeof data.branch === "string"
  );
}

function normalizeAge(age: number): number {
  if (!Number.isFinite(age)) return 1;
  return Math.max(1, Math.floor(age));
}

function normalizeMonth(month: number): number {
  if (!Number.isFinite(month)) return 1;
  return Math.min(12, Math.max(1, Math.floor(month)));
}

function normalizeHour(hour: number): number {
  if (!Number.isFinite(hour)) return 0;
  return Math.min(23, Math.max(0, Math.floor(hour)));
}

function normalizeSolarDateTime(input: CycleDateTimeInput): CycleDateTimeInput {
  const year = Number.isFinite(input.year) ? Math.floor(input.year) : 2000;
  const month = normalizeMonth(input.month);
  const day = clampSolarDay(year, month, input.day);
  const hour = normalizeHour(input.hour);
  return { year, month, day, hour };
}

function buildSolarGanzhi(input: CycleDateTimeInput): ReturnType<typeof getStemBranch> | null {
  const normalized = normalizeSolarDateTime(input);
  try {
    return getStemBranch(normalized.year, normalized.month, normalized.day, normalized.hour);
  } catch {
    return null;
  }
}

function resolvePresetFromChart(chart: Chart, preset?: CycleRulePreset): CycleRulePreset {
  if (preset) return preset;
  if (!chart.cycleConfig) return resolveCycleRulePreset(chart.ruleSetId ?? "default");

  return {
    id: chart.cycleConfig.presetId,
    label: chart.cycleConfig.label,
    yearDivide: chart.cycleConfig.yearDivide,
    smallLimitMethod: chart.cycleConfig.smallLimitMethod,
    monthlyMethod: chart.cycleConfig.monthlyMethod,
  };
}

function mutagenSummary(mutagens: readonly MutagenResult[]): string {
  return mutagens.map((item) => `${item.type}${item.star}`).join("、");
}

/**
 * 规则集 -> 运限预设映射（未知 ID 回落 default）。
 */
export function resolveCycleRulePreset(ruleSetId: string): CycleRulePreset {
  return getCycleRulePreset(ruleSetId);
}

/**
 * 获取某公历年月的天数。
 */
export function getDaysInSolarMonth(year: number, month: number): number {
  const normalizedYear = Number.isFinite(year) ? Math.floor(year) : 2000;
  const normalizedMonth = normalizeMonth(month);
  return new Date(normalizedYear, normalizedMonth, 0).getDate();
}

/**
 * 归一化日（限制到该月有效范围）。
 */
export function clampSolarDay(year: number, month: number, day: number): number {
  const maxDay = getDaysInSolarMonth(year, month);
  if (!Number.isFinite(day)) return 1;
  return Math.min(maxDay, Math.max(1, Math.floor(day)));
}

/**
 * 生年 -> 虚岁。
 */
export function getVirtualAgeByYear(birthYear: number, year: number): number {
  return Math.max(1, year - birthYear + 1);
}

/**
 * 生年 + 虚岁 -> 公历年。
 */
export function getYearByVirtualAge(birthYear: number, age: number): number {
  return birthYear + normalizeAge(age) - 1;
}

/**
 * 从命盘读取大限概览。
 */
export function readDecadalOverview(chart: Chart | null): DecadalOverviewItem[] {
  const raw = (chart?.horoscope as unknown as { decadals?: unknown[] } | undefined)?.decadals;
  if (!Array.isArray(raw)) return [];

  return raw.filter(isDecadalInfo).map((item, index) => ({
    index,
    startAge: item.startAge,
    endAge: item.endAge,
    palaceIndex: item.palaceIndex,
    stem: item.stem,
    branch: item.branch,
  }));
}

/**
 * 将宫位索引转为“宫名(地支)”文本。
 */
export function getPalaceLabel(chart: Chart | null, palaceIndex: number | null): string {
  if (!chart || palaceIndex == null) return "—";
  const palace = chart.palaces.find((item) => item.index === palaceIndex);
  if (!palace) return `宫位${palaceIndex + 1}`;
  return `${palace.name}(${palace.branch})`;
}

/**
 * 在概览中按虚岁查大限。
 */
export function findDecadalOverviewByAge(
  decadals: readonly DecadalOverviewItem[],
  age: number
): DecadalOverviewItem | null {
  const currentAge = normalizeAge(age);
  return decadals.find((item) => currentAge >= item.startAge && currentAge <= item.endAge) ?? null;
}

/**
 * 生成“年层”运限数据。
 */
export function buildCycleYearRow(
  chart: Chart,
  decadals: readonly DecadalOverviewItem[],
  age: number,
  options?: { month?: number; day?: number; hour?: number; preset?: CycleRulePreset }
): CycleYearRow | null {
  const birthYear = chart.date.solar.year;
  const normalizedAge = normalizeAge(age);
  const year = getYearByVirtualAge(birthYear, normalizedAge);
  const preset = resolvePresetFromChart(chart, options?.preset);
  const refMonth = normalizeMonth(options?.month ?? chart.date.solar.month);
  const refDay = clampSolarDay(year, refMonth, options?.day ?? chart.date.solar.day);
  const yearStemBranch = getYearStemBranchByDivide(year, refMonth, refDay, preset.yearDivide);
  const { stem, branch } = parseStemBranch(yearStemBranch);
  const yearlyPalaceIndex = getYearlyPalaceIndex(branch);
  const decadal = findDecadalOverviewByAge(decadals, normalizedAge);
  const { branch: birthYearBranch } = parseStemBranch(chart.date.ganzhi.year);
  const smallLimitPalaceIndex = getSmallLimitPalaceIndex(birthYearBranch, chart.birth.gender, normalizedAge, {
    method: preset.smallLimitMethod,
    mingPalaceIndex: chart.mingPalaceIndex,
  });

  return {
    age: normalizedAge,
    year,
    decadalIndex: decadal?.index ?? null,
    decadalPalaceIndex: decadal?.palaceIndex ?? null,
    smallLimitPalaceIndex,
    yearlyPalaceIndex,
    yearStem: stem,
    yearBranch: branch,
    yearlyMutagens: getYearlyMutagens(stem),
    yearlyStars: getYearlyStars(branch),
  };
}

/**
 * 生成年龄区间（闭区间）的年层运限。
 */
export function buildCycleRowsInAgeRange(
  chart: Chart,
  decadals: readonly DecadalOverviewItem[],
  fromAge: number,
  toAge: number,
  options?: { preset?: CycleRulePreset }
): CycleYearRow[] {
  const startAge = normalizeAge(Math.min(fromAge, toAge));
  const endAge = normalizeAge(Math.max(fromAge, toAge));
  const rows: CycleYearRow[] = [];

  for (let age = startAge; age <= endAge; age += 1) {
    const row = options?.preset
      ? buildCycleYearRow(chart, decadals, age, { preset: options.preset })
      : buildCycleYearRow(chart, decadals, age);
    if (row) rows.push(row);
  }

  return rows;
}

/**
 * 生成流月数据。
 */
export function buildMonthlyCycleRow(
  input: CycleDateTimeInput,
  options?: { chart?: Chart; preset?: CycleRulePreset }
): MonthlyCycleRow | null {
  const normalized = normalizeSolarDateTime(input);
  const preset = options?.chart
    ? resolvePresetFromChart(options.chart, options?.preset)
    : (options?.preset ?? resolveCycleRulePreset("default"));

  try {
    const monthStemBranch = getMonthlyStemBranch(normalized.year, normalized.month, normalized.day, {
      method: preset.monthlyMethod,
      yearDivide: preset.yearDivide,
    });
    const { stem, branch } = parseStemBranch(monthStemBranch);

    return {
      ...normalized,
      monthStem: stem,
      monthBranch: branch,
      monthlyPalaceIndex: getYearlyPalaceIndex(branch),
      monthlyMutagens: getYearlyMutagens(stem),
    };
  } catch {
    return null;
  }
}

/**
 * 生成流日数据。
 */
export function buildDailyCycleRow(input: CycleDateTimeInput): DailyCycleRow | null {
  const normalized = normalizeSolarDateTime(input);
  const ganzhi = buildSolarGanzhi(normalized);
  if (!ganzhi) return null;
  const { stem, branch } = parseStemBranch(ganzhi.day);

  return {
    ...normalized,
    dayStem: stem,
    dayBranch: branch,
    dailyPalaceIndex: getYearlyPalaceIndex(branch),
    dailyMutagens: getYearlyMutagens(stem),
  };
}

/**
 * 生成流时数据。
 */
export function buildHourlyCycleRow(input: CycleDateTimeInput): HourlyCycleRow | null {
  const normalized = normalizeSolarDateTime(input);
  const ganzhi = buildSolarGanzhi(normalized);
  if (!ganzhi?.time) return null;
  const { stem, branch } = parseStemBranch(ganzhi.time);

  return {
    ...normalized,
    hourStem: stem,
    hourBranch: branch,
    hourlyPalaceIndex: getYearlyPalaceIndex(branch),
    hourlyMutagens: getYearlyMutagens(stem),
  };
}

/**
 * 生成完整运限快照（大限/小限/流年/流月/流日/流时）。
 */
export function buildCycleSnapshot(chart: Chart | null, input: CycleQueryInput): CycleSnapshot | null {
  if (!chart) return null;
  const normalized = normalizeSolarDateTime(input);
  const preset = resolvePresetFromChart(chart);
  const decadals = readDecadalOverview(chart);

  return {
    decadals,
    yearly: buildCycleYearRow(chart, decadals, input.age, { ...normalized, preset }),
    monthly: buildMonthlyCycleRow(normalized, { chart, preset }),
    daily: buildDailyCycleRow(normalized),
    hourly: buildHourlyCycleRow(normalized),
    preset,
  };
}

/**
 * 比较两条“年层”运限，输出变化项。
 */
export function compareYearlyRows(
  previous: CycleYearRow | null,
  current: CycleYearRow | null
): YearlyComparison | null {
  if (!previous || !current) return null;

  const smallChanged = previous.smallLimitPalaceIndex !== current.smallLimitPalaceIndex;
  const yearlyChanged = previous.yearlyPalaceIndex !== current.yearlyPalaceIndex;
  const decadalChanged = previous.decadalPalaceIndex !== current.decadalPalaceIndex;
  const prevMutagen = mutagenSummary(previous.yearlyMutagens);
  const currentMutagen = mutagenSummary(current.yearlyMutagens);

  return {
    previousAge: previous.age,
    currentAge: current.age,
    previousYear: previous.year,
    currentYear: current.year,
    smallLimit: {
      from: previous.smallLimitPalaceIndex,
      to: current.smallLimitPalaceIndex,
      changed: smallChanged,
    },
    yearlyPalace: {
      from: previous.yearlyPalaceIndex,
      to: current.yearlyPalaceIndex,
      changed: yearlyChanged,
    },
    decadalPalace: {
      from: previous.decadalPalaceIndex,
      to: current.decadalPalaceIndex,
      changed: decadalChanged,
    },
    mutagens: {
      from: prevMutagen,
      to: currentMutagen,
      changed: prevMutagen !== currentMutagen,
    },
  };
}

/**
 * Query 风格运限访问器。
 */
export class CycleQuery {
  private readonly chart: Chart;

  constructor(chart: Chart) {
    this.chart = chart;
  }

  /**
   * 获取大限概览。
   */
  getDecadals(): DecadalOverviewItem[] {
    return readDecadalOverview(this.chart);
  }

  /**
   * 按虚岁查当前大限。
   */
  findDecadal(age: number): DecadalOverviewItem | null {
    return findDecadalOverviewByAge(this.getDecadals(), age);
  }

  /**
   * 获取某虚岁的年层数据。
   */
  yearly(age: number, options?: { month?: number; day?: number; hour?: number }): CycleYearRow | null {
    return buildCycleYearRow(this.chart, this.getDecadals(), age, options);
  }

  /**
   * 获取年龄区间年层列表。
   */
  range(fromAge: number, toAge: number): CycleYearRow[] {
    return buildCycleRowsInAgeRange(this.chart, this.getDecadals(), fromAge, toAge);
  }

  /**
   * 获取完整快照。
   */
  snapshot(input: CycleQueryInput): CycleSnapshot | null {
    return buildCycleSnapshot(this.chart, input);
  }

  /**
   * 对比某虚岁与上一虚岁的变化。
   */
  compareWithPreviousAge(input: CycleQueryInput): YearlyComparison | null {
    const current = this.snapshot(input);
    if (!current) return null;
    const previousAge = Math.max(1, normalizeAge(input.age) - 1);
    const previousYear = getYearByVirtualAge(this.chart.date.solar.year, previousAge);
    const previous = this.snapshot({
      ...input,
      age: previousAge,
      year: previousYear,
      day: clampSolarDay(previousYear, input.month, input.day),
    });
    return compareYearlyRows(previous?.yearly ?? null, current.yearly ?? null);
  }
}

/**
 * 便捷工厂：为空命盘时返回 null。
 */
export function createCycleQuery(chart: Chart | null): CycleQuery | null {
  if (!chart) return null;
  return new CycleQuery(chart);
}

/**
 * 统一宫位索引（帮助 UI 层处理 undefined/null）。
 */
export function normalizePalaceIndex(index: number | null | undefined): PalaceIndex | null {
  if (typeof index !== "number" || !Number.isFinite(index)) return null;
  const normalized = ((Math.floor(index) % 12) + 12) % 12;
  return normalized as PalaceIndex;
}
