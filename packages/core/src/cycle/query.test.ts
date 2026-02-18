import { describe, expect, it } from "vitest";

import { buildChart, type BirthInfo } from "../builder";
import {
  buildCycleRowsInAgeRange,
  buildCycleSnapshot,
  buildMonthlyCycleRow,
  clampSolarDay,
  compareYearlyRows,
  createCycleQuery,
  getDaysInSolarMonth,
  readDecadalOverview,
  resolveCycleRulePreset,
} from "./index";

const SAMPLE_BIRTH: BirthInfo = {
  gender: "男",
  datetime: "1990-01-15T08:00:00",
  timeIndex: 4,
};

describe("cycle query api", () => {
  it("builds full cycle snapshot for default preset", () => {
    const chart = buildChart(SAMPLE_BIRTH).chart;
    const snapshot = buildCycleSnapshot(chart, {
      age: 37,
      year: 2026,
      month: 2,
      day: 28,
      hour: 9,
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.preset.id).toBe("default");
    expect(snapshot?.yearly).not.toBeNull();
    expect(snapshot?.monthly).not.toBeNull();
    expect(snapshot?.daily).not.toBeNull();
    expect(snapshot?.hourly).not.toBeNull();
  });

  it("follows chart cycle config preset", () => {
    const chart = buildChart(SAMPLE_BIRTH, { ruleSetId: "zhongzhou" }).chart;
    const snapshot = buildCycleSnapshot(chart, {
      age: 20,
      year: 2009,
      month: 8,
      day: 10,
      hour: 9,
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.preset.id).toBe("zhongzhou");
    expect(snapshot?.preset.yearDivide).toBe("lunar-year");
    expect(snapshot?.preset.monthlyMethod).toBe("lunar-month");
  });

  it("builds rows in a decadal range", () => {
    const chart = buildChart(SAMPLE_BIRTH).chart;
    const decadals = readDecadalOverview(chart);
    expect(decadals.length).toBeGreaterThan(0);
    const active = decadals.find((item) => 37 >= item.startAge && 37 <= item.endAge);
    expect(active).toBeDefined();

    const rows = buildCycleRowsInAgeRange(chart, decadals, active!.startAge, active!.endAge);
    expect(rows).toHaveLength(10);
    expect(rows[0]?.age).toBe(active?.startAge);
  });

  it("supports query object and yearly comparison", () => {
    const chart = buildChart(SAMPLE_BIRTH).chart;
    const query = createCycleQuery(chart);
    expect(query).not.toBeNull();

    const current = query!.snapshot({
      age: 37,
      year: 2026,
      month: 2,
      day: 28,
      hour: 9,
    });
    const previous = query!.snapshot({
      age: 36,
      year: 2025,
      month: 2,
      day: 28,
      hour: 9,
    });
    const comparison = compareYearlyRows(previous?.yearly ?? null, current?.yearly ?? null);

    expect(comparison).not.toBeNull();
    expect(comparison?.previousAge).toBe(36);
    expect(comparison?.currentAge).toBe(37);
  });

  it("supports monthly build without chart when preset is given", () => {
    const preset = resolveCycleRulePreset("zhongzhou");
    const monthly = buildMonthlyCycleRow(
      {
        year: 2024,
        month: 2,
        day: 7,
        hour: 9,
      },
      { preset }
    );

    expect(monthly).not.toBeNull();
    expect(monthly?.monthStem).toBe("乙");
    expect(monthly?.monthBranch).toBe("卯");
  });

  it("keeps date normalization helpers stable", () => {
    expect(getDaysInSolarMonth(2026, 2)).toBe(28);
    expect(clampSolarDay(2026, 2, 30)).toBe(28);
  });
});

