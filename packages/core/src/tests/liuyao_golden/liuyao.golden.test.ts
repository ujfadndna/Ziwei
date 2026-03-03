import { describe, expect, it } from "vitest";

import { buildLiuyaoChart } from "../../systems/liuyao";
import type { LiuyaoInput } from "../../types";

const YANG_STATIC = ["heads", "tails", "tails"] as const; // 7: 少阳
const YIN_STATIC = ["heads", "heads", "tails"] as const; // 8: 少阴
const YANG_MOVING = ["heads", "heads", "heads"] as const; // 9: 老阳
const YIN_MOVING = ["tails", "tails", "tails"] as const; // 6: 老阴

interface GoldenFixture {
  name: string;
  input: LiuyaoInput;
}

const GOLDEN_FIXTURES: GoldenFixture[] = [
  {
    name: "g01-all-young-yang",
    input: {
      gender: "男",
      datetime: "2024-01-15T08:10:00+08:00",
      timeIndex: 4,
      casting: {
        lineThrows: [YANG_STATIC, YANG_STATIC, YANG_STATIC, YANG_STATIC, YANG_STATIC, YANG_STATIC],
      },
    },
  },
  {
    name: "g02-all-young-yin",
    input: {
      gender: "女",
      datetime: "2024-02-10T09:45:00+08:00",
      timeIndex: 5,
      casting: {
        lineThrows: [YIN_STATIC, YIN_STATIC, YIN_STATIC, YIN_STATIC, YIN_STATIC, YIN_STATIC],
      },
    },
  },
  {
    name: "g03-mixed-moving-lines",
    input: {
      gender: "男",
      datetime: "2024-03-20T23:30:00+08:00",
      timeIndex: 0,
      casting: {
        lineThrows: [YIN_MOVING, YANG_STATIC, YIN_STATIC, YANG_MOVING, YIN_STATIC, YANG_STATIC],
      },
    },
  },
  {
    name: "g04-balanced-static",
    input: {
      gender: "女",
      datetime: "2024-06-10T06:50:00+08:00",
      timeIndex: 3,
      casting: {
        lineThrows: [YANG_STATIC, YIN_STATIC, YANG_STATIC, YIN_STATIC, YANG_STATIC, YIN_STATIC],
      },
    },
  },
  {
    name: "g05-cross-timezone",
    input: {
      gender: "男",
      datetime: "2024-11-25T02:30:00-05:00",
      timeIndex: 1,
      location: {
        timeZone: "America/New_York",
      },
      casting: {
        lineThrows: [YANG_STATIC, YANG_MOVING, YIN_STATIC, YIN_MOVING, YANG_STATIC, YIN_STATIC],
      },
    },
  },
];

describe("liuyao golden fixtures", () => {
  for (const fixture of GOLDEN_FIXTURES) {
    it(`matches golden snapshot: ${fixture.name}`, () => {
      const chart = buildLiuyaoChart(fixture.input);
      expect({
        baseHexagram: chart.baseHexagram,
        changedHexagram: chart.changedHexagram,
        xunkong: chart.xunkong,
        lunarInfo: {
          monthBuild: chart.lunarInfo.monthBuild,
          dayChen: chart.lunarInfo.dayChen,
          ganzhi: chart.lunarInfo.ganzhi,
        },
        rulesApplied: chart.rulesApplied,
        lineDigest: chart.lines.map((line) => ({
          lineIndex: line.line.lineIndex,
          yinYang: line.line.yinYang,
          moving: line.line.moving,
          changedYinYang: line.changedYinYang,
          base: {
            spirit: line.base.spirit,
            branch: line.base.branch,
            element: line.base.element,
            relative: line.base.relative,
            isVoid: line.base.isVoid,
            markers: line.base.markers,
          },
          changed: {
            spirit: line.changed.spirit,
            branch: line.changed.branch,
            element: line.changed.element,
            relative: line.changed.relative,
            isVoid: line.changed.isVoid,
            markers: line.changed.markers,
          },
        })),
      }).toMatchSnapshot();
    });
  }
});
