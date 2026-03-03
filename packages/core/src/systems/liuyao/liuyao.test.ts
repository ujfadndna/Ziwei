import { describe, expect, it } from "vitest";

import { buildLiuyaoChart } from "./index";
import type { LiuyaoInput } from "../../types";

const YANG_STATIC = ["heads", "tails", "tails"] as const; // 7: 少阳
const YIN_STATIC = ["heads", "heads", "tails"] as const; // 8: 少阴
const YANG_MOVING = ["heads", "heads", "heads"] as const; // 9: 老阳
const YIN_MOVING = ["tails", "tails", "tails"] as const; // 6: 老阴

function readTrace(chart: ReturnType<typeof buildLiuyaoChart>, key: string) {
  return chart.trace.find((step) => step.key === key);
}

describe("buildLiuyaoChart", () => {
  it("builds base and changed hexagrams with explicit 3-coin lines", () => {
    const chart = buildLiuyaoChart({
      gender: "男",
      datetime: "2025-01-16T09:00:00+08:00",
      timeIndex: 5,
      casting: {
        lineThrows: [
          YIN_MOVING, // 0 -> 1
          YANG_STATIC, // 1 -> 1
          YIN_STATIC, // 0 -> 0
          YANG_MOVING, // 1 -> 0
          YIN_STATIC, // 0 -> 0
          YANG_STATIC, // 1 -> 1
        ],
      },
    });
    expect(chart.baseHexagram.name).toBe("火水未济");
    expect(chart.changedHexagram.name).toBe("山泽损");
    expect(chart.lines[0]?.line.moving).toBe(true);
    expect(chart.lines[3]?.line.moving).toBe(true);
    expect(chart.lines[0]?.base.markers).toContain("动");
    expect(chart.lines[0]?.changed.markers).toContain("变");
  });

  it("keeps late-zi in same day and records dayShift=0", () => {
    const lateZiInput: LiuyaoInput = {
      gender: "男",
      datetime: "2024-03-05T23:30:00+08:00",
      timeIndex: 0,
      casting: {
        lineThrows: [YANG_STATIC, YANG_STATIC, YANG_STATIC, YANG_STATIC, YANG_STATIC, YANG_STATIC],
      },
    };
    const eveningInput: LiuyaoInput = {
      ...lateZiInput,
      datetime: "2024-03-05T21:30:00+08:00",
      timeIndex: 11,
    };
    const lateZi = buildLiuyaoChart(lateZiInput);
    const evening = buildLiuyaoChart(eveningInput);
    expect(lateZi.lunarInfo.ganzhi.day).toBe(evening.lunarInfo.ganzhi.day);
    expect(readTrace(lateZi, "late-zi")?.data).toMatchObject({
      ziHourRollover: "lateZi",
      dayShift: 0,
      lateZiWindow: true,
    });
  });

  it("uses deterministic casting when no lineThrows are provided", () => {
    const input: LiuyaoInput = {
      gender: "女",
      datetime: "2025-02-18T14:00:00+08:00",
      timeIndex: 7,
    };
    const first = buildLiuyaoChart(input);
    const second = buildLiuyaoChart(input);
    expect(first).toEqual(second);
    expect(readTrace(first, "casting")?.data).toMatchObject({
      source: "deterministic",
      seed: expect.any(Number),
    });
  });

  it("records timezone and required trace checkpoints", () => {
    const chart = buildLiuyaoChart({
      gender: "女",
      datetime: "2024-11-25T02:30:00-05:00",
      timeIndex: 1,
      location: { timeZone: "America/New_York" },
      casting: {
        lineThrows: [YANG_STATIC, YIN_STATIC, YANG_STATIC, YIN_STATIC, YANG_STATIC, YIN_STATIC],
      },
    });
    expect(chart.rulesApplied.timezone).toBe("America/New_York");
    expect(chart.trace.map((step) => step.key)).toEqual(
      expect.arrayContaining(["casting", "hexagram", "shiying", "najia", "liuqin", "xunkong", "six-spirits"]),
    );
  });
});
