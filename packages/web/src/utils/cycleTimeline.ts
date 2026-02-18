import type {
  Chart,
  CycleDateTimeInput,
  CycleRulePreset,
  CycleSnapshot,
  CycleYearRow,
  DailyCycleRow,
  DecadalOverviewItem,
  HourlyCycleRow,
  MonthlyCycleRow,
} from "@ziwei/core";
import {
  buildCycleSnapshot as buildCycleSnapshotCore,
  buildCycleYearRow as buildCycleYearRowCore,
  buildDailyCycleRow as buildDailyCycleRowCore,
  buildHourlyCycleRow as buildHourlyCycleRowCore,
  buildMonthlyCycleRow as buildMonthlyCycleRowCore,
  clampSolarDay as clampSolarDayCore,
  findDecadalOverviewByAge,
  getDaysInSolarMonth as getDaysInSolarMonthCore,
  getPalaceLabel as getPalaceLabelCore,
  getSmallLimitPalaceIndex as getSmallLimitPalaceIndexCore,
  getVirtualAgeByYear as getVirtualAgeByYearCore,
  getYearByVirtualAge as getYearByVirtualAgeCore,
  readDecadalOverview as readDecadalOverviewCore,
  resolveCycleRulePreset as resolveCycleRulePresetCore,
} from "@ziwei/core";

export type { CycleSnapshot, CycleYearRow, DailyCycleRow, DecadalOverviewItem, HourlyCycleRow, MonthlyCycleRow };

export type SmallLimitMethod = CycleRulePreset["smallLimitMethod"];
export type MonthlyMethod = CycleRulePreset["monthlyMethod"];

const SUPPORTED_YEAR_MAX = 2100;

interface SolarDateTimeInput extends CycleDateTimeInput {}

export function resolveCycleRulePreset(ruleSetId: string): CycleRulePreset {
  return resolveCycleRulePresetCore(ruleSetId);
}

export function getDaysInSolarMonth(year: number, month: number): number {
  return getDaysInSolarMonthCore(year, month);
}

export function clampSolarDay(year: number, month: number, day: number): number {
  return clampSolarDayCore(year, month, day);
}

export function getSmallLimitPalaceIndex(
  yearBranch: Parameters<typeof getSmallLimitPalaceIndexCore>[0],
  gender: Parameters<typeof getSmallLimitPalaceIndexCore>[1],
  age: number,
  options?: { method?: SmallLimitMethod; mingPalaceIndex?: number }
): number {
  return getSmallLimitPalaceIndexCore(yearBranch, gender, age, options);
}

export function getVirtualAgeByYear(birthYear: number, year: number): number {
  return getVirtualAgeByYearCore(birthYear, year);
}

export function getYearByVirtualAge(birthYear: number, age: number): number {
  return getYearByVirtualAgeCore(birthYear, age);
}

export function readDecadalOverview(chart: Chart | null): DecadalOverviewItem[] {
  return readDecadalOverviewCore(chart);
}

export function getPalaceLabel(chart: Chart | null, palaceIndex: number | null): string {
  return getPalaceLabelCore(chart, palaceIndex);
}

export function findDecadalByAge(decadals: readonly DecadalOverviewItem[], age: number): DecadalOverviewItem | null {
  return findDecadalOverviewByAge(decadals, age);
}

export function buildCycleYearRow(
  chart: Chart,
  decadals: readonly DecadalOverviewItem[],
  age: number,
  options?: { month?: number; day?: number; hour?: number; preset?: CycleRulePreset }
): CycleYearRow | null {
  try {
    return buildCycleYearRowCore(chart, decadals, age, options);
  } catch {
    return null;
  }
}

export function buildCycleRowsInAgeRange(
  chart: Chart,
  decadals: readonly DecadalOverviewItem[],
  fromAge: number,
  toAge: number,
  options?: { preset?: CycleRulePreset }
): CycleYearRow[] {
  const minAge = Math.max(1, Math.floor(Math.min(fromAge, toAge)));
  const maxAgeByYear = Math.max(1, SUPPORTED_YEAR_MAX - chart.date.solar.year + 1);
  const maxAge = Math.min(Math.max(1, Math.floor(Math.max(fromAge, toAge))), maxAgeByYear);
  const rows: CycleYearRow[] = [];

  for (let age = minAge; age <= maxAge; age += 1) {
    const row = options?.preset
      ? buildCycleYearRow(chart, decadals, age, { preset: options.preset })
      : buildCycleYearRow(chart, decadals, age);
    if (!row) break;
    rows.push(row);
  }

  return rows;
}

export function buildMonthlyCycleRow(
  input: SolarDateTimeInput,
  options?: { preset?: CycleRulePreset }
): MonthlyCycleRow | null {
  try {
    if (options?.preset) {
      return buildMonthlyCycleRowCore(input, { preset: options.preset });
    }
    return buildMonthlyCycleRowCore(input);
  } catch {
    return null;
  }
}

export function buildDailyCycleRow(input: SolarDateTimeInput): DailyCycleRow | null {
  try {
    return buildDailyCycleRowCore(input);
  } catch {
    return null;
  }
}

export function buildHourlyCycleRow(input: SolarDateTimeInput): HourlyCycleRow | null {
  try {
    return buildHourlyCycleRowCore(input);
  } catch {
    return null;
  }
}

export function buildCycleSnapshot(chart: Chart | null, input: SolarDateTimeInput & { age: number }): CycleSnapshot | null {
  try {
    return buildCycleSnapshotCore(chart, input);
  } catch {
    return null;
  }
}
