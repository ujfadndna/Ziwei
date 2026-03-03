import { describe, expect, it } from "vitest";

import { CHINA_CITIES, calculateTrueSolarTime, getCitiesByProvince, searchCities } from "./index";

describe("solar-time/cities", () => {
  it("provides 300+ city entries and covers 34 province-level regions", () => {
    expect(CHINA_CITIES.length).toBeGreaterThanOrEqual(300);
    expect(getCitiesByProvince().size).toBe(34);
  });

  it("supports exact and suffix search", () => {
    expect(searchCities("北京", 1)[0]?.name).toBe("北京");
    expect(searchCities("北京市", 1)[0]?.name).toBe("北京");
  });
});

describe("calculateTrueSolarTime", () => {
  it("北京（116.41°E）午时，修正约 -14 分钟，时辰不变", () => {
    const result = calculateTrueSolarTime("2024-04-15T12:00:00", 6, 116.41);
    expect(result.totalAdjustmentMinutes).toBeGreaterThan(-16);
    expect(result.totalAdjustmentMinutes).toBeLessThan(-12);
    expect(result.adjustedTimeIndex).toBe(6);
    expect(result.timeIndexChanged).toBe(false);
  });

  it("乌鲁木齐（87.62°E）辰时，修正约 -130 分钟，时辰从辰到寅", () => {
    const result = calculateTrueSolarTime("2024-04-15T07:00:00", 4, 87.62);
    expect(result.totalAdjustmentMinutes).toBeLessThan(-120);
    expect(result.totalAdjustmentMinutes).toBeGreaterThan(-140);
    expect(result.adjustedTimeIndex).toBe(2);
    expect(result.timeIndexChanged).toBe(true);
  });

  it("上海（121.47°E）正向微调约 +6 分钟", () => {
    const result = calculateTrueSolarTime("2024-04-15T10:00:00", 5, 121.47);
    expect(result.totalAdjustmentMinutes).toBeGreaterThan(4);
    expect(result.totalAdjustmentMinutes).toBeLessThan(8);
  });

  it("子时跨日边界：23:50 + 正向修正后仍为子时", () => {
    const result = calculateTrueSolarTime("2024-04-15T23:50:00", 0, 126.64);
    expect(result.adjustedDatetime.startsWith("2024-04-16T00:")).toBe(true);
    expect(result.adjustedTimeIndex).toBe(0);
    expect(result.timeIndexChanged).toBe(false);
  });

  it("精确经度 120°E 的经度修正为 0", () => {
    const result = calculateTrueSolarTime("2024-04-15T12:00:00", 6, 120);
    expect(result.breakdown.longitudeCorrectionMinutes).toBeCloseTo(0, 8);
  });

  it("子时回拨到 23 点时保持原始日期不变", () => {
    const result = calculateTrueSolarTime("2024-04-15T00:10:00", 0, 116.41);
    expect(result.adjustedDatetime.startsWith("2024-04-15T23:")).toBe(true);
    expect(result.adjustedTimeIndex).toBe(0);
  });
});
