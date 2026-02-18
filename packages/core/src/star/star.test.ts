/**
 * 星曜安星模块测试。
 */

import { describe, it, expect } from "vitest";
import {
  getZiweiPosition,
  getZiweiSeriesPositions,
  getTianfuPosition,
  getTianfuSeriesPositions,
  getAllMajorStarPositions,
  getLeftAssistantPosition,
  getRightAssistantPosition,
  getWenchangPosition,
  getWenchangPositionByTimeBranch,
  getWenquPosition,
  getWenquPositionByTimeBranch,
  getTiankuiPosition,
  getTianyuePosition,
  getLucunPosition,
  getQingyangPosition,
  getTuoluoPosition,
  getFireStarPosition,
  getBellStarPosition,
  getDikongPosition,
  getDijiePosition,
  getTianmaPosition,
  getBrightness,
  isAuspiciousBrightness,
  isInauspiciousBrightness,
} from "./index";

describe("紫微系主星安星", () => {
  describe("getZiweiPosition", () => {
    it("水二局初一日紫微在丑", () => {
      expect(getZiweiPosition(2, 1)).toBe(1); // 丑
    });

    it("水二局初二日紫微在寅", () => {
      expect(getZiweiPosition(2, 2)).toBe(2); // 寅
    });

    it("木三局初一日紫微在寅", () => {
      expect(getZiweiPosition(3, 1)).toBe(2); // 寅
    });

    it("金四局初一日紫微在寅", () => {
      expect(getZiweiPosition(4, 1)).toBe(2); // 寅
    });

    it("土五局初一日紫微在寅", () => {
      expect(getZiweiPosition(5, 1)).toBe(2); // 寅
    });

    it("火六局初一日紫微在寅", () => {
      expect(getZiweiPosition(6, 1)).toBe(2); // 寅
    });

    it("无效局数应抛出错误", () => {
      expect(() => getZiweiPosition(1, 1)).toThrow();
      expect(() => getZiweiPosition(7, 1)).toThrow();
    });

    it("无效日数应抛出错误", () => {
      expect(() => getZiweiPosition(2, 0)).toThrow();
      expect(() => getZiweiPosition(2, 31)).toThrow();
    });
  });

  describe("getZiweiSeriesPositions", () => {
    it("紫微在寅时，紫微系星曜位置正确", () => {
      const positions = getZiweiSeriesPositions(2); // 紫微在寅
      expect(positions["紫微"]).toBe(2); // 寅
      expect(positions["天机"]).toBe(1); // 丑
      expect(positions["太阳"]).toBe(11); // 亥
      expect(positions["武曲"]).toBe(10); // 戌
      expect(positions["天同"]).toBe(9); // 酉
      expect(positions["廉贞"]).toBe(6); // 午
    });
  });
});

describe("天府系主星安星", () => {
  describe("getTianfuPosition", () => {
    it("紫微在寅时天府在寅", () => {
      expect(getTianfuPosition(2)).toBe(2); // 寅
    });

    it("紫微在卯时天府在丑", () => {
      expect(getTianfuPosition(3)).toBe(1); // 丑
    });

    it("紫微在辰时天府在子", () => {
      expect(getTianfuPosition(4)).toBe(0); // 子
    });

    it("紫微在子时天府在辰", () => {
      expect(getTianfuPosition(0)).toBe(4); // 辰
    });
  });

  describe("getTianfuSeriesPositions", () => {
    it("天府在寅时，天府系星曜位置正确", () => {
      const positions = getTianfuSeriesPositions(2); // 天府在寅
      expect(positions["天府"]).toBe(2); // 寅
      expect(positions["太阴"]).toBe(3); // 卯
      expect(positions["贪狼"]).toBe(4); // 辰
      expect(positions["巨门"]).toBe(5); // 巳
      expect(positions["天相"]).toBe(6); // 午
      expect(positions["天梁"]).toBe(7); // 未
      expect(positions["七杀"]).toBe(8); // 申
      expect(positions["破军"]).toBe(0); // 子
    });
  });

  describe("getAllMajorStarPositions", () => {
    it("返回所有十四主星位置", () => {
      const positions = getAllMajorStarPositions(2); // 紫微在寅
      expect(Object.keys(positions)).toHaveLength(14);
      expect(positions["紫微"]).toBe(2);
      expect(positions["天府"]).toBe(2);
    });
  });
});

describe("六吉星安星", () => {
  describe("getLeftAssistantPosition", () => {
    it("正月左辅在辰", () => {
      expect(getLeftAssistantPosition(1)).toBe(4); // 辰
    });

    it("六月左辅在酉", () => {
      expect(getLeftAssistantPosition(6)).toBe(9); // 酉
    });

    it("十二月左辅在卯", () => {
      expect(getLeftAssistantPosition(12)).toBe(3); // 卯
    });
  });

  describe("getRightAssistantPosition", () => {
    it("正月右弼在戌", () => {
      expect(getRightAssistantPosition(1)).toBe(10); // 戌
    });

    it("六月右弼在巳", () => {
      expect(getRightAssistantPosition(6)).toBe(5); // 巳
    });

    it("十二月右弼在亥", () => {
      expect(getRightAssistantPosition(12)).toBe(11); // 亥
    });
  });

  describe("getWenchangPosition", () => {
    it("甲年文昌在戌", () => {
      expect(getWenchangPosition("甲")).toBe(10); // 戌
    });

    it("癸年文昌在丑", () => {
      expect(getWenchangPosition("癸")).toBe(1); // 丑
    });
  });

  describe("getWenchangPositionByTimeBranch", () => {
    it("子时文昌在戌", () => {
      expect(getWenchangPositionByTimeBranch("子")).toBe(10); // 戌
    });

    it("辰时文昌在午", () => {
      expect(getWenchangPositionByTimeBranch("辰")).toBe(6); // 午
    });
  });

  describe("getWenquPosition", () => {
    it("甲年文曲在辰", () => {
      expect(getWenquPosition("甲")).toBe(4); // 辰
    });

    it("癸年文曲在丑", () => {
      expect(getWenquPosition("癸")).toBe(1); // 丑
    });
  });

  describe("getWenquPositionByTimeBranch", () => {
    it("子时文曲在辰", () => {
      expect(getWenquPositionByTimeBranch("子")).toBe(4); // 辰
    });

    it("辰时文曲在申", () => {
      expect(getWenquPositionByTimeBranch("辰")).toBe(8); // 申
    });
  });

  describe("getTiankuiPosition", () => {
    it("甲年天魁在丑", () => {
      expect(getTiankuiPosition("甲")).toBe(1); // 丑
    });

    it("乙年天魁在子", () => {
      expect(getTiankuiPosition("乙")).toBe(0); // 子
    });
  });

  describe("getTianyuePosition", () => {
    it("甲年天钺在未", () => {
      expect(getTianyuePosition("甲")).toBe(7); // 未
    });

    it("乙年天钺在申", () => {
      expect(getTianyuePosition("乙")).toBe(8); // 申
    });
  });
});

describe("六煞星安星", () => {
  describe("getLucunPosition", () => {
    it("甲年禄存在寅", () => {
      expect(getLucunPosition("甲")).toBe(2); // 寅
    });

    it("乙年禄存在卯", () => {
      expect(getLucunPosition("乙")).toBe(3); // 卯
    });

    it("丙年禄存在巳", () => {
      expect(getLucunPosition("丙")).toBe(5); // 巳
    });
  });

  describe("getQingyangPosition", () => {
    it("甲年擎羊在卯（禄存前一位）", () => {
      expect(getQingyangPosition("甲")).toBe(3); // 卯
    });
  });

  describe("getTuoluoPosition", () => {
    it("甲年陀罗在丑（禄存后一位）", () => {
      expect(getTuoluoPosition("甲")).toBe(1); // 丑
    });
  });

  describe("getFireStarPosition", () => {
    it("寅年子时火星在丑", () => {
      expect(getFireStarPosition("寅", "子")).toBe(1); // 丑
    });

    it("申年子时火星在寅", () => {
      expect(getFireStarPosition("申", "子")).toBe(2); // 寅
    });
  });

  describe("getBellStarPosition", () => {
    it("寅年子时铃星在卯", () => {
      expect(getBellStarPosition("寅", "子")).toBe(3); // 卯
    });

    it("申年子时铃星在戌", () => {
      expect(getBellStarPosition("申", "子")).toBe(10); // 戌
    });
  });

  describe("getDikongPosition", () => {
    it("子时地空在亥", () => {
      expect(getDikongPosition("子")).toBe(11); // 亥
    });

    it("丑时地空在戌", () => {
      expect(getDikongPosition("丑")).toBe(10); // 戌
    });
  });

  describe("getDijiePosition", () => {
    it("子时地劫在亥", () => {
      expect(getDijiePosition("子")).toBe(11); // 亥
    });

    it("丑时地劫在子", () => {
      expect(getDijiePosition("丑")).toBe(0); // 子
    });
  });

  describe("getTianmaPosition", () => {
    it("寅年天马在申", () => {
      expect(getTianmaPosition("寅")).toBe(8); // 申
    });

    it("申年天马在寅", () => {
      expect(getTianmaPosition("申")).toBe(2); // 寅
    });

    it("巳年天马在亥", () => {
      expect(getTianmaPosition("巳")).toBe(11); // 亥
    });

    it("亥年天马在巳", () => {
      expect(getTianmaPosition("亥")).toBe(5); // 巳
    });
  });
});

describe("亮度计算", () => {
  describe("getBrightness", () => {
    it("紫微在子宫为庙", () => {
      expect(getBrightness("紫微", "子")).toBe("庙");
    });

    it("紫微在丑宫为旺", () => {
      expect(getBrightness("紫微", "丑")).toBe("旺");
    });

    it("太阳在卯宫为庙", () => {
      expect(getBrightness("太阳", "卯")).toBe("庙");
    });

    it("太阳在子宫为陷", () => {
      expect(getBrightness("太阳", "子")).toBe("陷");
    });

    it("未定义亮度的星曜返回undefined", () => {
      expect(getBrightness("红鸾", "子")).toBeUndefined();
    });
  });

  describe("isAuspiciousBrightness", () => {
    it("庙为吉", () => {
      expect(isAuspiciousBrightness("庙")).toBe(true);
    });

    it("旺为吉", () => {
      expect(isAuspiciousBrightness("旺")).toBe(true);
    });

    it("得为吉", () => {
      expect(isAuspiciousBrightness("得")).toBe(true);
    });

    it("利不为吉", () => {
      expect(isAuspiciousBrightness("利")).toBe(false);
    });

    it("陷不为吉", () => {
      expect(isAuspiciousBrightness("陷")).toBe(false);
    });
  });

  describe("isInauspiciousBrightness", () => {
    it("不为凶", () => {
      expect(isInauspiciousBrightness("不")).toBe(true);
    });

    it("陷为凶", () => {
      expect(isInauspiciousBrightness("陷")).toBe(true);
    });

    it("庙不为凶", () => {
      expect(isInauspiciousBrightness("庙")).toBe(false);
    });

    it("平不为凶", () => {
      expect(isInauspiciousBrightness("平")).toBe(false);
    });
  });
});
