/**
 * 运限模块测试。
 */

import { describe, it, expect } from "vitest";
import {
  getCycleRulePreset,
  getDecadalStartAge,
  getDecadalDirection,
  getStemYinYang,
  getDecadalPalaces,
  findDecadalByAge,
  getMonthlyStemBranch,
  getSmallLimitPalaceIndex,
  getYearStemBranchByDivide,
  getYearlyPalaceIndex,
  getYearlyMutagens,
  getYearlyStars,
  getYearlyPalaceIndices,
  resolveCycleConfig,
} from "./index";

describe("大限计算", () => {
  describe("getDecadalStartAge", () => {
    it("水二局2岁起运", () => {
      expect(getDecadalStartAge(2)).toBe(2);
    });

    it("木三局3岁起运", () => {
      expect(getDecadalStartAge(3)).toBe(3);
    });

    it("金四局4岁起运", () => {
      expect(getDecadalStartAge(4)).toBe(4);
    });

    it("土五局5岁起运", () => {
      expect(getDecadalStartAge(5)).toBe(5);
    });

    it("火六局6岁起运", () => {
      expect(getDecadalStartAge(6)).toBe(6);
    });

    it("无效局数应抛出错误", () => {
      expect(() => getDecadalStartAge(1)).toThrow();
      expect(() => getDecadalStartAge(7)).toThrow();
    });
  });

  describe("getStemYinYang", () => {
    it("甲为阳", () => {
      expect(getStemYinYang("甲")).toBe("阳");
    });

    it("乙为阴", () => {
      expect(getStemYinYang("乙")).toBe("阴");
    });

    it("丙戊庚壬为阳", () => {
      expect(getStemYinYang("丙")).toBe("阳");
      expect(getStemYinYang("戊")).toBe("阳");
      expect(getStemYinYang("庚")).toBe("阳");
      expect(getStemYinYang("壬")).toBe("阳");
    });

    it("丁己辛癸为阴", () => {
      expect(getStemYinYang("丁")).toBe("阴");
      expect(getStemYinYang("己")).toBe("阴");
      expect(getStemYinYang("辛")).toBe("阴");
      expect(getStemYinYang("癸")).toBe("阴");
    });
  });

  describe("getDecadalDirection", () => {
    it("阳男顺行", () => {
      expect(getDecadalDirection("男", "阳")).toBe(1);
    });

    it("阴女顺行", () => {
      expect(getDecadalDirection("女", "阴")).toBe(1);
    });

    it("阴男逆行", () => {
      expect(getDecadalDirection("男", "阴")).toBe(-1);
    });

    it("阳女逆行", () => {
      expect(getDecadalDirection("女", "阳")).toBe(-1);
    });
  });

  describe("getDecadalPalaces", () => {
    it("阳男水二局命宫在寅，大限顺行", () => {
      const decadals = getDecadalPalaces(2, "男", "甲", 2); // 命宫在寅(2)，甲年阳男
      expect(decadals).toHaveLength(12);
      expect(decadals[0].palaceIndex).toBe(2); // 第一大限在寅
      expect(decadals[0].startAge).toBe(2);
      expect(decadals[0].endAge).toBe(11);
      expect(decadals[1].palaceIndex).toBe(3); // 第二大限在卯（顺行）
      expect(decadals[1].startAge).toBe(12);
    });

    it("阴男木三局命宫在寅，大限逆行", () => {
      const decadals = getDecadalPalaces(2, "男", "乙", 3); // 命宫在寅(2)，乙年阴男
      expect(decadals[0].palaceIndex).toBe(2); // 第一大限在寅
      expect(decadals[0].startAge).toBe(3);
      expect(decadals[1].palaceIndex).toBe(1); // 第二大限在丑（逆行）
    });
  });

  describe("findDecadalByAge", () => {
    it("根据年龄查找大限", () => {
      const decadals = getDecadalPalaces(2, "男", "甲", 2);
      expect(findDecadalByAge(decadals, 5)?.startAge).toBe(2);
      expect(findDecadalByAge(decadals, 15)?.startAge).toBe(12);
      expect(findDecadalByAge(decadals, 1)).toBeUndefined();
    });
  });
});

describe("流年计算", () => {
  describe("getYearlyPalaceIndex", () => {
    it("子年流年命宫在子", () => {
      expect(getYearlyPalaceIndex("子")).toBe(0);
    });

    it("寅年流年命宫在寅", () => {
      expect(getYearlyPalaceIndex("寅")).toBe(2);
    });

    it("亥年流年命宫在亥", () => {
      expect(getYearlyPalaceIndex("亥")).toBe(11);
    });
  });

  describe("getYearlyMutagens", () => {
    it("甲年四化正确", () => {
      const mutagens = getYearlyMutagens("甲");
      expect(mutagens).toHaveLength(4);
      expect(mutagens.find((m) => m.type === "化禄")?.star).toBe("廉贞");
      expect(mutagens.find((m) => m.type === "化权")?.star).toBe("破军");
      expect(mutagens.find((m) => m.type === "化科")?.star).toBe("武曲");
      expect(mutagens.find((m) => m.type === "化忌")?.star).toBe("太阳");
    });

    it("乙年四化正确", () => {
      const mutagens = getYearlyMutagens("乙");
      expect(mutagens.find((m) => m.type === "化禄")?.star).toBe("天机");
      expect(mutagens.find((m) => m.type === "化忌")?.star).toBe("太阴");
    });
  });

  describe("getYearlyStars", () => {
    it("子年流年星曜位置正确", () => {
      const stars = getYearlyStars("子");
      const taisui = stars.find((s) => s.name === "太岁");
      const suipo = stars.find((s) => s.name === "岁破");
      expect(taisui?.palaceIndex).toBe(0); // 太岁在子
      expect(suipo?.palaceIndex).toBe(6); // 岁破在午
    });

    it("寅年流年星曜位置正确", () => {
      const stars = getYearlyStars("寅");
      const taisui = stars.find((s) => s.name === "太岁");
      expect(taisui?.palaceIndex).toBe(2); // 太岁在寅
    });
  });

  describe("getYearlyPalaceIndices", () => {
    it("子年流年十二宫位置正确", () => {
      const indices = getYearlyPalaceIndices("子");
      expect(indices[0]).toBe(0); // 命宫在子
      expect(indices[1]).toBe(11); // 兄弟在亥（逆时针）
      expect(indices[6]).toBe(6); // 迁移在午
    });
  });
});

describe("运限口径配置", () => {
  it("resolves default preset by ruleset", () => {
    const preset = getCycleRulePreset("default");
    expect(preset.id).toBe("default");
    expect(preset.yearDivide).toBe("lichun");
    expect(preset.smallLimitMethod).toBe("year-group");
    expect(preset.monthlyMethod).toBe("solar-term");
  });

  it("resolves zhongzhou preset by ruleset", () => {
    const preset = getCycleRulePreset("zhongzhou");
    expect(preset.id).toBe("zhongzhou");
    expect(preset.yearDivide).toBe("lunar-year");
    expect(preset.smallLimitMethod).toBe("ming-palace");
    expect(preset.monthlyMethod).toBe("lunar-month");
  });

  it("allows overrides on top of preset", () => {
    const resolved = resolveCycleConfig("zhongzhou", { monthlyMethod: "solar-term" });
    expect(resolved.presetId).toBe("zhongzhou");
    expect(resolved.smallLimitMethod).toBe("ming-palace");
    expect(resolved.monthlyMethod).toBe("solar-term");
  });
});

describe("运限运行时口径", () => {
  it("supports year divide by lichun vs lunar-year", () => {
    const byLichun = getYearStemBranchByDivide(2024, 2, 7, "lichun");
    const byLunarYear = getYearStemBranchByDivide(2024, 2, 7, "lunar-year");

    expect(byLichun).toBe("甲辰");
    expect(byLunarYear).toBe("癸卯");
  });

  it("supports monthly stem-branch by method", () => {
    const bySolarTerm = getMonthlyStemBranch(2024, 2, 7, {
      method: "solar-term",
      yearDivide: "lichun",
    });
    const byLunarMonth = getMonthlyStemBranch(2024, 2, 7, {
      method: "lunar-month",
      yearDivide: "lunar-year",
    });

    expect(bySolarTerm).toBe("丙寅");
    expect(byLunarMonth).toBe("乙卯");
  });

  it("supports small-limit methods", () => {
    const byYearGroup = getSmallLimitPalaceIndex("寅", "男", 1, { method: "year-group" });
    const byMingPalace = getSmallLimitPalaceIndex("寅", "男", 1, {
      method: "ming-palace",
      mingPalaceIndex: 9,
    });
    expect(byYearGroup).toBe(4);
    expect(byMingPalace).toBe(9);
  });
});
