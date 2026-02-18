import { describe, expect, it } from "vitest";

import {
  getLichunDate,
  getSolarTerm,
  getSolarTerms,
  getStemBranch,
  getStemBranchOfDay,
  getStemBranchOfHour,
  getStemBranchOfMonth,
  getStemBranchOfYear,
  is24SolarTerms,
  lunarToSolar,
  parseStemBranch,
  solarToLunar,
} from "./index";

describe("calendar converter", () => {
  it("converts solar -> lunar for known anchor dates", () => {
    expect(solarToLunar(1900, 1, 31)).toEqual({ year: 1900, month: 1, day: 1, isLeap: false });
    expect(solarToLunar(1900, 2, 14)).toEqual({ year: 1900, month: 1, day: 15, isLeap: false });

    // 2024-02-10: Chinese New Year (农历正月初一)
    expect(solarToLunar(2024, 2, 10)).toEqual({ year: 2024, month: 1, day: 1, isLeap: false });
  });

  it("handles leap months (solar -> lunar)", () => {
    // 2017-07-23: 农历 2017 年 闰六月初一
    expect(solarToLunar(2017, 7, 23)).toEqual({ year: 2017, month: 6, day: 1, isLeap: true });

    // 2020-05-23: 农历 2020 年 闰四月初一
    expect(solarToLunar(2020, 5, 23)).toEqual({ year: 2020, month: 4, day: 1, isLeap: true });

    // 2012-05-21: 农历 2012 年 闰四月初一
    expect(solarToLunar(2012, 5, 21)).toEqual({ year: 2012, month: 4, day: 1, isLeap: true });
  });

  it("converts lunar -> solar for known anchor dates", () => {
    expect(lunarToSolar(1900, 1, 1, false)).toEqual({ year: 1900, month: 1, day: 31 });
    expect(lunarToSolar(2024, 1, 1, false)).toEqual({ year: 2024, month: 2, day: 10 });
  });

  it("handles leap months (lunar -> solar)", () => {
    expect(lunarToSolar(2017, 6, 1, true)).toEqual({ year: 2017, month: 7, day: 23 });

    // 2020 年：四月初一=2020-04-23；闰四月初一=2020-05-23
    expect(lunarToSolar(2020, 4, 1, false)).toEqual({ year: 2020, month: 4, day: 23 });
    expect(lunarToSolar(2020, 4, 1, true)).toEqual({ year: 2020, month: 5, day: 23 });

    // 2012 年：四月初一=2012-04-21；闰四月初一=2012-05-21
    expect(lunarToSolar(2012, 4, 1, false)).toEqual({ year: 2012, month: 4, day: 21 });
    expect(lunarToSolar(2012, 4, 1, true)).toEqual({ year: 2012, month: 5, day: 21 });
  });

  it("throws on out-of-range and invalid inputs", () => {
    expect(() => solarToLunar(1900, 1, 30)).toThrow(/out of supported range/i);
    expect(() => solarToLunar(2100, 2, 30)).toThrow(/Invalid solar date/i);

    // 2024 年无闰月：请求闰正月应报错
    expect(() => lunarToSolar(2024, 1, 1, true)).toThrow(/leap month/i);

    // 农历日超过当月上限
    expect(() => lunarToSolar(2024, 1, 31, false)).toThrow(/Invalid lunar date day/i);
  });
});

describe("solar terms helpers", () => {
  it("exposes 24 solar terms data and term lookup", () => {
    expect(is24SolarTerms).toHaveLength(24);
    expect(is24SolarTerms).toContain("立春");

    // 2024 立春为 2/4（常见历法口径，按本算法取 UTC 日）
    expect(getLichunDate(2024)).toEqual({ year: 2024, month: 2, day: 4 });
    expect(getSolarTerm(2024, 2, 4)).toBe("立春");
    expect(getSolarTerm(2024, 2, 5)).toBeNull();
  });

  it("returns all 24 solar terms for a year", () => {
    const terms2024 = getSolarTerms(2024);
    expect(terms2024).toHaveLength(24);

    // 验证第一个节气（小寒）
    expect(terms2024[0]!.name).toBe("小寒");
    expect(terms2024[0]!.date.year).toBe(2024);
    expect(terms2024[0]!.date.month).toBe(1);

    // 验证立春（索引2）
    expect(terms2024[2]!.name).toBe("立春");
    expect(terms2024[2]!.date).toEqual({ year: 2024, month: 2, day: 4 });

    // 验证最后一个节气（冬至）
    expect(terms2024[23]!.name).toBe("冬至");
    expect(terms2024[23]!.date.month).toBe(12);
  });
});

describe("ganzhi helpers", () => {
  it("computes year/month/day/hour stem-branch building blocks", () => {
    // 年柱（纯映射：干支年从当年立春起算）
    expect(getStemBranchOfYear(1900)).toBe("庚子");
    expect(getStemBranchOfYear(1984)).toBe("甲子");

    // 年柱（按立春边界回推）
    expect(getStemBranchOfYear(2024, 2, 3)).toBe("癸卯");
    expect(getStemBranchOfYear(2024, 2, 4)).toBe("甲辰");

    // parseStemBranch：拆分干支为天干/地支
    expect(parseStemBranch("甲辰")).toEqual({ stem: "甲", branch: "辰" });

    // 甲子年：丙寅起月（年上起月）
    const { stem: yearStem1984 } = parseStemBranch(getStemBranchOfYear(1984));
    const { stem: yearStem1985 } = parseStemBranch(getStemBranchOfYear(1985));
    expect(getStemBranchOfMonth(yearStem1984, 1)).toBe("丙寅");
    expect(getStemBranchOfMonth(yearStem1984, 12)).toBe("丁丑");
    expect(getStemBranchOfMonth(yearStem1985, 1)).toBe("戊寅");

    // 2017-07-28（农历 2017 闰六月初六）：丙辰日（来源：常见历法查询口径）
    expect(getStemBranchOfDay(2017, 7, 28)).toBe("丙辰");

    // 丙日：子时起戊子
    expect(getStemBranchOfHour("丙", 0)).toBe("戊子");
    expect(getStemBranchOfHour("丙", 23)).toBe("戊子");
    expect(getStemBranchOfHour("丙", 1)).toBe("己丑");
  });

  it("computes full ganzhi pillars for a solar date/time", () => {
    // 2017-07-28 00:00：丁酉年 丁未月 丙辰日 戊子时
    expect(getStemBranch(2017, 7, 28, 0)).toEqual({
      year: "丁酉",
      month: "丁未",
      day: "丙辰",
      time: "戊子",
    });

    // 立春边界：立春前一年柱应回推（这里仅验证年/月柱口径）
    expect(getStemBranch(2024, 2, 3, 0).year).toBe("癸卯");
    expect(getStemBranch(2024, 2, 3, 0).month).toBe("乙丑");
    expect(getStemBranch(2024, 2, 4, 0).year).toBe("甲辰");
    expect(getStemBranch(2024, 2, 4, 0).month).toBe("丙寅");
  });
});
