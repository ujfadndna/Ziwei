/**
 * 命盘构建器集成测试。
 */

import { describe, it, expect } from "vitest";
import { buildChart, ChartBuilder } from "./chart-builder";
import type { BirthInfo } from "../types";

describe("ChartBuilder", () => {
  // 测试用例：1990年1月15日 08:00 男
  const testBirth1: BirthInfo = {
    gender: "男",
    datetime: "1990-01-15T08:00:00+08:00",
    timeIndex: 4, // 辰时
  };

  // 测试用例：1985年6月20日 14:00 女
  const testBirth2: BirthInfo = {
    gender: "女",
    datetime: "1985-06-20T14:00:00+08:00",
    timeIndex: 7, // 未时
  };

  describe("buildChart", () => {
    it("should build a complete chart for male born in 1990", () => {
      const result = buildChart(testBirth1);

      expect(result.chart).toBeDefined();
      expect(result.chart.birth).toEqual(testBirth1);
      expect(result.chart.palaces).toHaveLength(12);
      expect(result.chart.mingPalaceIndex).toBeGreaterThanOrEqual(0);
      expect(result.chart.mingPalaceIndex).toBeLessThanOrEqual(11);
    });

    it("should build a complete chart for female born in 1985", () => {
      const result = buildChart(testBirth2);

      expect(result.chart).toBeDefined();
      expect(result.chart.birth).toEqual(testBirth2);
      expect(result.chart.palaces).toHaveLength(12);
    });

    it("should include date info with solar, lunar, and ganzhi", () => {
      const result = buildChart(testBirth1);

      expect(result.chart.date.solar).toBeDefined();
      expect(result.chart.date.lunar).toBeDefined();
      expect(result.chart.date.ganzhi).toBeDefined();
      expect(result.chart.date.ganzhi.year).toBeDefined();
      expect(result.chart.date.ganzhi.month).toBeDefined();
      expect(result.chart.date.ganzhi.day).toBeDefined();
    });

    it("should place major stars in palaces", () => {
      const result = buildChart(testBirth1);

      // 检查是否有主星
      const allStars = result.chart.palaces.flatMap((p) => p.stars);
      const majorStars = allStars.filter((s) => s.type === "major");

      expect(majorStars.length).toBe(14); // 十四主星

      // 检查紫微星存在
      const ziwei = majorStars.find((s) => s.name === "紫微");
      expect(ziwei).toBeDefined();

      // 检查天府星存在
      const tianfu = majorStars.find((s) => s.name === "天府");
      expect(tianfu).toBeDefined();
    });

    it("should place minor stars in palaces", () => {
      const result = buildChart(testBirth1);

      const allStars = result.chart.palaces.flatMap((p) => p.stars);
      const minorStars = allStars.filter((s) => s.type === "minor");

      // 检查六吉星
      expect(minorStars.find((s) => s.name === "左辅")).toBeDefined();
      expect(minorStars.find((s) => s.name === "右弼")).toBeDefined();
      expect(minorStars.find((s) => s.name === "文昌")).toBeDefined();
      expect(minorStars.find((s) => s.name === "文曲")).toBeDefined();
      expect(minorStars.find((s) => s.name === "天魁")).toBeDefined();
      expect(minorStars.find((s) => s.name === "天钺")).toBeDefined();

      // 检查六煞星
      expect(minorStars.find((s) => s.name === "擎羊")).toBeDefined();
      expect(minorStars.find((s) => s.name === "陀罗")).toBeDefined();
      expect(minorStars.find((s) => s.name === "火星")).toBeDefined();
      expect(minorStars.find((s) => s.name === "铃星")).toBeDefined();
      expect(minorStars.find((s) => s.name === "地空")).toBeDefined();
      expect(minorStars.find((s) => s.name === "地劫")).toBeDefined();

      // 检查禄存和天马
      expect(minorStars.find((s) => s.name === "禄存")).toBeDefined();
      expect(minorStars.find((s) => s.name === "天马")).toBeDefined();
    });

    it("should place wenchang and wenqu by time branch", () => {
      const result = buildChart(testBirth1);

      const wenchangPalace = result.chart.palaces.find((p) =>
        p.stars.some((s) => s.name === "文昌")
      );
      const wenquPalace = result.chart.palaces.find((p) =>
        p.stars.some((s) => s.name === "文曲")
      );

      // testBirth1 为辰时：文昌在午、文曲在申
      expect(wenchangPalace?.branch).toBe("午");
      expect(wenquPalace?.branch).toBe("申");
    });

    it("should include adjective stars in palaces", () => {
      const result = buildChart(testBirth1);
      const allStars = result.chart.palaces.flatMap((p) => p.stars);
      const adjectiveStars = allStars.filter((s) => s.type === "adjective");

      expect(adjectiveStars.length).toBeGreaterThanOrEqual(30);
      expect(adjectiveStars.find((s) => s.name === "红鸾")).toBeDefined();
      expect(adjectiveStars.find((s) => s.name === "天喜")).toBeDefined();
      expect(adjectiveStars.find((s) => s.name === "三台")).toBeDefined();
      expect(adjectiveStars.find((s) => s.name === "八座")).toBeDefined();
      expect(adjectiveStars.find((s) => s.name === "台辅")).toBeDefined();
      expect(adjectiveStars.find((s) => s.name === "封诰")).toBeDefined();
      expect(adjectiveStars.find((s) => s.name === "天哭")).toBeDefined();
      expect(adjectiveStars.find((s) => s.name === "天虚")).toBeDefined();
      expect(adjectiveStars.find((s) => s.name === "天使")).toBeDefined();
      expect(adjectiveStars.find((s) => s.name === "天伤")).toBeDefined();
      expect(adjectiveStars.find((s) => s.name === "年解")).toBeDefined();
    });

    it("should apply brightness to stars", () => {
      const result = buildChart(testBirth1);

      const allStars = result.chart.palaces.flatMap((p) => p.stars);
      const majorStars = allStars.filter((s) => s.type === "major");

      // 主星应该都有亮度
      for (const star of majorStars) {
        expect(star.brightness).toBeDefined();
      }
    });

    it("should apply mutagens based on year stem", () => {
      const result = buildChart(testBirth1);

      const allStars = result.chart.palaces.flatMap((p) => p.stars);
      const starsWithMutagen = allStars.filter((s) => s.mutagen);

      // 应该有4颗星有四化
      expect(starsWithMutagen.length).toBe(4);

      // 检查四化类型
      const mutagenTypes = starsWithMutagen.map((s) => s.mutagen!.type);
      expect(mutagenTypes).toContain("化禄");
      expect(mutagenTypes).toContain("化权");
      expect(mutagenTypes).toContain("化科");
      expect(mutagenTypes).toContain("化忌");
    });

    it("should calculate decadals", () => {
      const result = buildChart(testBirth1);

      expect(result.chart.horoscope).toBeDefined();
      expect(result.chart.horoscope!.decadals).toBeDefined();
      expect(result.chart.horoscope!.decadals).toHaveLength(12);

      // 检查大限年龄范围
      const decadals = result.chart.horoscope!.decadals!;
      for (let i = 0; i < decadals.length; i++) {
        expect(decadals[i].endAge - decadals[i].startAge).toBe(9);
      }
    });

    it("should include meta info with five element and soul/body stars", () => {
      const result = buildChart(testBirth1);

      expect(result.chart.meta).toBeDefined();
      expect(result.chart.meta!.fiveElement).toBeDefined();
      expect(result.chart.meta!.soulStar).toBeDefined();
      expect(result.chart.meta!.bodyStar).toBeDefined();
      expect(result.chart.meta!.originPalace).toBeDefined();
    });

    it("should compute origin palace index", () => {
      const result = buildChart(testBirth1);

      expect(result.chart.originPalaceIndex).toBeDefined();
      const originPalace = result.chart.palaces.find((p) => p.index === result.chart.originPalaceIndex);
      expect(originPalace).toBeDefined();
      expect(originPalace!.branch).not.toBe("子");
      expect(originPalace!.branch).not.toBe("丑");
      expect(originPalace!.stem).toBe(result.chart.date.ganzhi.year[0]);
    });
  });

  describe("ChartBuilder with options", () => {
    it("should use default rule set id", () => {
      const result = buildChart(testBirth1);
      expect(result.chart.ruleSetId).toBe("default");
    });

    it("should use custom rule set id", () => {
      const result = buildChart(testBirth1, { ruleSetId: "custom-v1" });
      expect(result.chart.ruleSetId).toBe("custom-v1");
    });

    it("should include trace when enabled (default)", () => {
      const result = buildChart(testBirth1);
      expect(result.trace).toBeDefined();
      expect(result.trace!.steps.length).toBeGreaterThan(0);
    });

    it("should not include trace when disabled", () => {
      const result = buildChart(testBirth1, { enableTrace: false });
      expect(result.trace).toBeUndefined();
    });

    it("should resolve cycle config from ruleset", () => {
      const defaultChart = buildChart(testBirth1).chart;
      expect(defaultChart.cycleConfig?.presetId).toBe("default");
      expect(defaultChart.cycleConfig?.yearDivide).toBe("lichun");

      const zhongzhouChart = buildChart(testBirth1, { ruleSetId: "zhongzhou" }).chart;
      expect(zhongzhouChart.cycleConfig?.presetId).toBe("zhongzhou");
      expect(zhongzhouChart.cycleConfig?.yearDivide).toBe("lunar-year");
      expect(zhongzhouChart.cycleConfig?.monthlyMethod).toBe("lunar-month");
    });

    it("should allow overriding cycle config", () => {
      const result = buildChart(testBirth1, {
        ruleSetId: "default",
        cycleConfig: {
          monthlyMethod: "lunar-month",
        },
      });
      expect(result.chart.cycleConfig?.presetId).toBe("default");
      expect(result.chart.cycleConfig?.monthlyMethod).toBe("lunar-month");
      expect(result.chart.cycleConfig?.smallLimitMethod).toBe("year-group");
    });
  });

  describe("derivation trace", () => {
    it("should record calendar conversion step", () => {
      const result = buildChart(testBirth1);

      const calendarStep = result.trace!.steps.find((s) =>
        s.description.includes("历法转换")
      );
      expect(calendarStep).toBeDefined();
      expect(calendarStep!.output).toBeDefined();
    });

    it("should record soul-body calculation step", () => {
      const result = buildChart(testBirth1);

      const soulBodyStep = result.trace!.steps.find((s) =>
        s.description.includes("命宫身宫")
      );
      expect(soulBodyStep).toBeDefined();
    });

    it("should record five element calculation step", () => {
      const result = buildChart(testBirth1);

      const fiveElementStep = result.trace!.steps.find((s) =>
        s.description.includes("五行局")
      );
      expect(fiveElementStep).toBeDefined();
    });

    it("should record major stars placement step", () => {
      const result = buildChart(testBirth1);

      const majorStarsStep = result.trace!.steps.find((s) =>
        s.description.includes("安主星")
      );
      expect(majorStarsStep).toBeDefined();
    });

    it("should record minor stars placement step", () => {
      const result = buildChart(testBirth1);

      const minorStarsStep = result.trace!.steps.find((s) =>
        s.description.includes("安辅星")
      );
      expect(minorStarsStep).toBeDefined();
    });

    it("should record mutagens application step", () => {
      const result = buildChart(testBirth1);

      const mutagensStep = result.trace!.steps.find((s) =>
        s.description.includes("四化")
      );
      expect(mutagensStep).toBeDefined();
    });

    it("should record decadals calculation step", () => {
      const result = buildChart(testBirth1);

      const decadalsStep = result.trace!.steps.find((s) =>
        s.description.includes("大限")
      );
      expect(decadalsStep).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("should handle leap month birth", () => {
      // 闰月出生的情况（使用一个已知有闰月的年份）
      const leapMonthBirth: BirthInfo = {
        gender: "男",
        datetime: "2020-05-23T10:00:00+08:00", // 2020年闰四月初一
        timeIndex: 5, // 巳时
      };

      const result = buildChart(leapMonthBirth);
      expect(result.chart).toBeDefined();
      expect(result.chart.palaces).toHaveLength(12);
    });

    it("should handle early morning birth (zi hour)", () => {
      const ziHourBirth: BirthInfo = {
        gender: "女",
        datetime: "1995-03-15T00:30:00+08:00",
        timeIndex: 0, // 子时
      };

      const result = buildChart(ziHourBirth);
      expect(result.chart).toBeDefined();
    });

    it("should handle late night birth (hai hour)", () => {
      const haiHourBirth: BirthInfo = {
        gender: "男",
        datetime: "2000-12-31T22:00:00+08:00",
        timeIndex: 11, // 亥时
      };

      const result = buildChart(haiHourBirth);
      expect(result.chart).toBeDefined();
    });
  });

  describe("consistency checks", () => {
    it("should have ming palace at index 0 named 命宫", () => {
      const result = buildChart(testBirth1);

      const mingPalace = result.chart.palaces[result.chart.mingPalaceIndex];
      expect(mingPalace.name).toBe("命宫");
    });

    it("should have all 12 palace names", () => {
      const result = buildChart(testBirth1);

      const palaceNames = result.chart.palaces.map((p) => p.name);
      expect(palaceNames).toContain("命宫");
      expect(palaceNames).toContain("兄弟");
      expect(palaceNames).toContain("夫妻");
      expect(palaceNames).toContain("子女");
      expect(palaceNames).toContain("财帛");
      expect(palaceNames).toContain("疾厄");
      expect(palaceNames).toContain("迁移");
      expect(palaceNames).toContain("仆役");
      expect(palaceNames).toContain("官禄");
      expect(palaceNames).toContain("田宅");
      expect(palaceNames).toContain("福德");
      expect(palaceNames).toContain("父母");
    });

    it("should have unique branches for all palaces", () => {
      const result = buildChart(testBirth1);

      const branches = result.chart.palaces.map((p) => p.branch);
      const uniqueBranches = new Set(branches);
      expect(uniqueBranches.size).toBe(12);
    });
  });
});
