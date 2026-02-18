import { describe, expect, it } from "vitest";

import {
  arrangePalaces,
  FIVE_ELEMENT_CLASSES,
  getBodyPalaceBranch,
  getBodyStar,
  getFiveElementClass,
  getOriginPalaceIndex,
  getPalaceByBranch,
  getPalaceStem,
  getSoulPalaceBranch,
  getSoulStar,
  PALACE_NAMES,
} from "./index";

describe("soul-body", () => {
  describe("getSoulPalaceBranch", () => {
    it("calculates soul palace for known cases", () => {
      // 正月子时：寅起正月顺数0月=寅，逆数0时=寅
      expect(getSoulPalaceBranch(1, 0)).toBe("寅");

      // 正月寅时：寅起正月顺数0月=寅，逆数2时=子
      expect(getSoulPalaceBranch(1, 2)).toBe("子");

      // 二月子时：寅起正月顺数1月=卯，逆数0时=卯
      expect(getSoulPalaceBranch(2, 0)).toBe("卯");

      // 六月午时：寅起正月顺数5月=未，逆数6时=丑
      expect(getSoulPalaceBranch(6, 6)).toBe("丑");

      // 十二月亥时：寅起正月顺数11月=丑，逆数11时=寅
      expect(getSoulPalaceBranch(12, 11)).toBe("寅");
    });

    it("throws on invalid inputs", () => {
      expect(() => getSoulPalaceBranch(0, 0)).toThrow(/lunarMonth/);
      expect(() => getSoulPalaceBranch(13, 0)).toThrow(/lunarMonth/);
      expect(() => getSoulPalaceBranch(1, 12)).toThrow(/timeIndex=12/);
      expect(() => getSoulPalaceBranch(1, -1 as any)).toThrow(/timeIndex/);
    });
  });

  describe("getBodyPalaceBranch", () => {
    it("calculates body palace for known cases", () => {
      // 正月子时：从寅顺数0月=寅，顺数0时=寅
      expect(getBodyPalaceBranch(1, 0)).toBe("寅");

      // 正月寅时：从寅顺数0月=寅，顺数2时=辰
      expect(getBodyPalaceBranch(1, 2)).toBe("辰");

      // 二月子时：从寅顺数1月=卯，顺数0时=卯
      expect(getBodyPalaceBranch(2, 0)).toBe("卯");

      // 六月午时：从寅顺数5月=未，顺数6时=丑
      expect(getBodyPalaceBranch(6, 6)).toBe("丑");
    });

    it("throws on invalid inputs", () => {
      expect(() => getBodyPalaceBranch(0, 0)).toThrow(/lunarMonth/);
      expect(() => getBodyPalaceBranch(1, 12)).toThrow(/timeIndex=12/);
    });
  });

  describe("getSoulStar", () => {
    it("returns correct soul star for each branch", () => {
      expect(getSoulStar("子")).toBe("贪狼");
      expect(getSoulStar("丑")).toBe("巨门");
      expect(getSoulStar("辰")).toBe("廉贞");
      expect(getSoulStar("巳")).toBe("武曲");
      expect(getSoulStar("午")).toBe("破军");
    });
  });

  describe("getBodyStar", () => {
    it("returns correct body star for each branch", () => {
      expect(getBodyStar("子")).toBe("火星");
      expect(getBodyStar("丑")).toBe("天相");
      expect(getBodyStar("寅")).toBe("天梁");
      expect(getBodyStar("卯")).toBe("天同");
      expect(getBodyStar("辰")).toBe("文昌");
      expect(getBodyStar("巳")).toBe("天机");
    });
  });
});

describe("five-element", () => {
  it("has correct five element classes", () => {
    expect(FIVE_ELEMENT_CLASSES).toHaveLength(5);
    expect(FIVE_ELEMENT_CLASSES[0]).toEqual({ element: "水", number: 2, name: "水二局" });
    expect(FIVE_ELEMENT_CLASSES[4]).toEqual({ element: "火", number: 6, name: "火六局" });
  });

  describe("getFiveElementClass", () => {
    it("calculates five element class for known cases", () => {
      // 甲年命宫在子：水二局（丙子纳音=涧下水）
      expect(getFiveElementClass("子", "甲")).toEqual({ element: "水", number: 2, name: "水二局" });

      // 甲年命宫在丑：水二局（丁丑纳音=涧下水）
      expect(getFiveElementClass("丑", "甲")).toEqual({ element: "水", number: 2, name: "水二局" });

      // 甲年命宫在寅：火六局（丙寅纳音=炉中火）
      expect(getFiveElementClass("寅", "甲")).toEqual({ element: "火", number: 6, name: "火六局" });

      // 乙年命宫在子：火六局（戊子纳音=霹雳火）
      expect(getFiveElementClass("子", "乙")).toEqual({ element: "火", number: 6, name: "火六局" });

      // 丙年命宫在子：土五局（庚子纳音=壁上土）
      expect(getFiveElementClass("子", "丙")).toEqual({ element: "土", number: 5, name: "土五局" });

      // 丁年命宫在子：木三局（壬子纳音=桑柘木）
      expect(getFiveElementClass("子", "丁")).toEqual({ element: "木", number: 3, name: "木三局" });

      // 戊年命宫在子：金四局（甲子纳音=海中金）
      expect(getFiveElementClass("子", "戊")).toEqual({ element: "金", number: 4, name: "金四局" });
    });

    it("handles stem grouping correctly", () => {
      // 甲己同组
      expect(getFiveElementClass("子", "甲")).toEqual(getFiveElementClass("子", "己"));
      // 乙庚同组
      expect(getFiveElementClass("子", "乙")).toEqual(getFiveElementClass("子", "庚"));
      // 丙辛同组
      expect(getFiveElementClass("子", "丙")).toEqual(getFiveElementClass("子", "辛"));
    });

    it("handles branch grouping correctly", () => {
      // 子丑同组
      expect(getFiveElementClass("子", "甲")).toEqual(getFiveElementClass("丑", "甲"));
      // 寅卯同组
      expect(getFiveElementClass("寅", "甲")).toEqual(getFiveElementClass("卯", "甲"));
    });
  });
});

describe("arrangement", () => {
  it("has correct palace names", () => {
    expect(PALACE_NAMES).toHaveLength(12);
    expect(PALACE_NAMES[0]).toBe("命宫");
    expect(PALACE_NAMES[1]).toBe("兄弟");
    expect(PALACE_NAMES[6]).toBe("迁移");
    expect(PALACE_NAMES[11]).toBe("父母");
  });

  describe("getPalaceStem", () => {
    it("calculates palace stem correctly", () => {
      // 甲年寅宫起丙（定寅首）
      expect(getPalaceStem("甲", 2)).toBe("丙");
      expect(getPalaceStem("甲", 3)).toBe("丁"); // 卯宫
      expect(getPalaceStem("甲", 4)).toBe("戊"); // 辰宫

      // 乙年寅宫起戊
      expect(getPalaceStem("乙", 2)).toBe("戊");
      expect(getPalaceStem("乙", 3)).toBe("己"); // 卯宫

      // 丙年寅宫起庚
      expect(getPalaceStem("丙", 2)).toBe("庚");

      // 丁年寅宫起壬
      expect(getPalaceStem("丁", 2)).toBe("壬");

      // 戊年寅宫起甲
      expect(getPalaceStem("戊", 2)).toBe("甲");
    });

    it("handles stem grouping correctly", () => {
      // 甲己同组
      expect(getPalaceStem("甲", 2)).toBe(getPalaceStem("己", 2));
      // 乙庚同组
      expect(getPalaceStem("乙", 2)).toBe(getPalaceStem("庚", 2));
    });

    it("wraps around correctly", () => {
      // 甲年子宫：从寅(丙)顺布到子 -> 丙
      expect(getPalaceStem("甲", 0)).toBe("丙");
      // 甲年丑宫：从寅(丙)顺布到丑 -> 丁
      expect(getPalaceStem("甲", 1)).toBe("丁");
    });
  });

  describe("arrangePalaces", () => {
    it("arranges palaces correctly from soul branch", () => {
      // 命宫在寅(索引2)，甲年
      const palaces = arrangePalaces(2, "甲");

      expect(palaces).toHaveLength(12);
      expect(palaces[0]!.name).toBe("命宫");
      expect(palaces[0]!.branch).toBe("寅");
      expect(palaces[0]!.stem).toBe("丙");

      expect(palaces[1]!.name).toBe("兄弟");
      expect(palaces[1]!.branch).toBe("丑"); // 逆时针

      expect(palaces[6]!.name).toBe("迁移");
      expect(palaces[6]!.branch).toBe("申"); // 对宫
    });

    it("handles different soul branch positions", () => {
      // 命宫在子(索引0)
      const palaces = arrangePalaces(0, "甲");

      expect(palaces[0]!.branch).toBe("子");
      expect(palaces[1]!.branch).toBe("亥"); // 逆时针
      expect(palaces[11]!.branch).toBe("丑"); // 父母宫
    });
  });

  describe("getOriginPalaceIndex", () => {
    it("finds origin palace by year stem and excludes 子/丑", () => {
      const palaces = arrangePalaces(2, "甲");
      const origin = getOriginPalaceIndex(palaces, "甲");

      expect(origin).toBe(4);
      expect(palaces[origin!].branch).toBe("戌");
      expect(palaces[origin!].name).toBe("财帛");
      expect(palaces[origin!].stem).toBe("甲");
    });

    it("works for different soul branch positions", () => {
      const palaces = arrangePalaces(0, "甲");
      const origin = getOriginPalaceIndex(palaces, "甲");

      expect(origin).toBe(2);
      expect(palaces[origin!].branch).toBe("戌");
    });
  });

  describe("getPalaceByBranch", () => {
    it("finds palace by branch", () => {
      const palaces = arrangePalaces(2, "甲");

      const palace = getPalaceByBranch(palaces, "寅");
      expect(palace.name).toBe("命宫");

      const palace2 = getPalaceByBranch(palaces, "申");
      expect(palace2.name).toBe("迁移");
    });

    it("throws on unknown branch", () => {
      const palaces = arrangePalaces(2, "甲");
      // 所有地支都应该能找到
      expect(() => getPalaceByBranch(palaces, "子")).not.toThrow();
    });
  });
});
