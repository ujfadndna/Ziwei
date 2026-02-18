import { buildChart, type BirthInfo } from "@ziwei/core";
import { describe, expect, it } from "vitest";

import {
  buildCycleSnapshot,
  buildCycleRowsInAgeRange,
  buildCycleYearRow,
  clampSolarDay,
  findDecadalByAge,
  getDaysInSolarMonth,
  getSmallLimitPalaceIndex,
  getVirtualAgeByYear,
  getYearByVirtualAge,
  readDecadalOverview,
  resolveCycleRulePreset,
} from "./cycleTimeline";

const SAMPLE_BIRTH: BirthInfo = {
  gender: "男",
  datetime: "1990-01-15T08:00:00",
  timeIndex: 4,
};

describe("cycleTimeline", () => {
  it("reads decadal overview from chart", () => {
    const chart = buildChart(SAMPLE_BIRTH).chart;
    const decadals = readDecadalOverview(chart);
    expect(decadals).toHaveLength(12);
    expect(decadals[0]?.startAge).toBeGreaterThanOrEqual(2);
    expect(decadals[0]?.endAge).toBe(decadals[0]!.startAge + 9);
  });

  it("converts year and virtual age back-and-forth", () => {
    expect(getVirtualAgeByYear(1990, 1990)).toBe(1);
    expect(getVirtualAgeByYear(1990, 2026)).toBe(37);
    expect(getYearByVirtualAge(1990, 37)).toBe(2026);
    expect(getYearByVirtualAge(1990, 1)).toBe(1990);
  });

  it("computes small limit palace index using gender direction", () => {
    // 寅年 -> 辰起
    const maleAge1 = getSmallLimitPalaceIndex("寅", "男", 1);
    const maleAge2 = getSmallLimitPalaceIndex("寅", "男", 2);
    const femaleAge2 = getSmallLimitPalaceIndex("寅", "女", 2);

    expect(maleAge1).toBe(4);
    expect(maleAge2).toBe(5);
    expect(femaleAge2).toBe(3);
  });

  it("builds yearly cycle rows in a decadal range", () => {
    const chart = buildChart(SAMPLE_BIRTH).chart;
    const decadals = readDecadalOverview(chart);
    const currentDecadal = findDecadalByAge(decadals, 35);
    expect(currentDecadal).not.toBeNull();

    const rows = buildCycleRowsInAgeRange(
      chart,
      decadals,
      currentDecadal!.startAge,
      currentDecadal!.endAge
    );
    expect(rows).toHaveLength(10);

    const row = buildCycleYearRow(chart, decadals, 35);
    expect(row).not.toBeNull();
    expect(row!.year).toBe(getYearByVirtualAge(chart.date.solar.year, 35));
    expect(row!.yearlyMutagens).toHaveLength(4);
    expect(row!.yearlyStars.length).toBeGreaterThanOrEqual(2);
  });

  it("builds monthly/daily/hourly layers from selected date time", () => {
    const chart = buildChart(SAMPLE_BIRTH).chart;
    expect(getDaysInSolarMonth(2026, 2)).toBe(28);
    expect(clampSolarDay(2026, 2, 30)).toBe(28);

    const snapshot = buildCycleSnapshot(chart, {
      age: 37,
      year: 2026,
      month: 2,
      day: 28,
      hour: 9,
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot!.yearly).not.toBeNull();
    expect(snapshot!.monthly).not.toBeNull();
    expect(snapshot!.daily).not.toBeNull();
    expect(snapshot!.hourly).not.toBeNull();
    expect(snapshot!.monthly!.monthlyMutagens).toHaveLength(4);
    expect(snapshot!.daily!.dailyMutagens).toHaveLength(4);
    expect(snapshot!.hourly!.hourlyMutagens).toHaveLength(4);
  });

  it("switches cycle algorithms by rule set preset", () => {
    const chart = buildChart({ ...SAMPLE_BIRTH }, { ruleSetId: "zhongzhou" }).chart;
    const preset = resolveCycleRulePreset("zhongzhou");
    expect(preset.yearDivide).toBe("lunar-year");
    expect(preset.smallLimitMethod).toBe("ming-palace");
    expect(preset.monthlyMethod).toBe("lunar-month");

    const snapshot = buildCycleSnapshot(chart, {
      age: 20,
      year: 2009,
      month: 8,
      day: 10,
      hour: 9,
    });
    expect(snapshot).not.toBeNull();
    expect(snapshot!.preset.id).toBe("zhongzhou");

    const byMingPalace = getSmallLimitPalaceIndex("寅", "男", 20, {
      method: "ming-palace",
      mingPalaceIndex: chart.mingPalaceIndex,
    });
    expect(snapshot!.yearly!.smallLimitPalaceIndex).toBe(byMingPalace);
  });
});
