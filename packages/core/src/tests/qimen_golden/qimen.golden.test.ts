import { describe, expect, it } from "vitest";

import { buildQimenChart } from "../../systems/qimen";
import type { QimenInput } from "../../types";

interface GoldenFixture {
  name: string;
  input: QimenInput;
}

const GOLDEN_FIXTURES: GoldenFixture[] = [
  {
    name: "g01-winter-midterm-utc8",
    input: {
      gender: "男",
      datetime: "2024-01-15T08:10:00+08:00",
      timeIndex: 4,
    },
  },
  {
    name: "g02-lichun-window-utc8",
    input: {
      gender: "女",
      datetime: "2024-02-10T09:45:00+08:00",
      timeIndex: 5,
    },
  },
  {
    name: "g03-spring-equinox-near-latezi",
    input: {
      gender: "男",
      datetime: "2024-03-20T23:30:00+08:00",
      timeIndex: 0,
    },
  },
  {
    name: "g04-grain-rain-window",
    input: {
      gender: "女",
      datetime: "2024-04-28T14:20:00+08:00",
      timeIndex: 7,
    },
  },
  {
    name: "g05-summer-before-solstice",
    input: {
      gender: "男",
      datetime: "2024-06-10T06:50:00+08:00",
      timeIndex: 3,
    },
  },
  {
    name: "g06-minor-heat-window",
    input: {
      gender: "女",
      datetime: "2024-07-18T16:00:00+08:00",
      timeIndex: 8,
    },
  },
  {
    name: "g07-white-dew-window",
    input: {
      gender: "男",
      datetime: "2024-08-30T20:40:00+08:00",
      timeIndex: 10,
    },
  },
  {
    name: "g08-cold-dew-window",
    input: {
      gender: "女",
      datetime: "2024-10-08T11:15:00+08:00",
      timeIndex: 6,
    },
  },
  {
    name: "g09-cross-timezone-utc5",
    input: {
      gender: "男",
      datetime: "2024-11-25T02:30:00-05:00",
      timeIndex: 1,
      location: {
        timeZone: "America/New_York",
      },
    },
  },
  {
    name: "g10-year-end-winter-solstice",
    input: {
      gender: "女",
      datetime: "2024-12-30T18:25:00+08:00",
      timeIndex: 9,
    },
  },
];

function readTrace(chart: ReturnType<typeof buildQimenChart>, key: string) {
  return chart.trace.find((step) => step.key === key);
}

describe("qimen golden fixtures", () => {
  for (const fixture of GOLDEN_FIXTURES) {
    it(`matches golden snapshot: ${fixture.name}`, () => {
      const chart = buildQimenChart(fixture.input);
      expect({
        solarTerm: chart.solarTerm,
        dun: chart.dun,
        yuan: chart.yuan,
        ju: chart.ju,
        xun: {
          hourStemBranch: chart.xun.hourStemBranch,
          xunName: chart.xun.xunName,
          xunShou: chart.xun.xunShou,
          xunKongBranches: chart.xun.xunKongBranches,
          xunKongPalaces: chart.xun.xunKongPalaces,
        },
        zhiFuZhiShi: chart.zhiFuZhiShi,
        palaceDigest: {
          "1": chart.palaces["1"],
          "2": chart.palaces["2"],
          "3": chart.palaces["3"],
          "4": chart.palaces["4"],
          "6": chart.palaces["6"],
          "7": chart.palaces["7"],
          "8": chart.palaces["8"],
          "9": chart.palaces["9"],
        },
      }).toMatchSnapshot();
    });
  }
});

describe("qimen boundary coverage", () => {
  it("switches from yin to yang around winter-solstice", () => {
    const before = buildQimenChart({
      gender: "男",
      datetime: "2024-12-20T12:00:00+08:00",
      timeIndex: 6,
    });
    const after = buildQimenChart({
      gender: "男",
      datetime: "2024-12-22T12:00:00+08:00",
      timeIndex: 6,
    });
    expect(before.dun).toBe("yin");
    expect(after.dun).toBe("yang");
  });

  it("switches from yang to yin around summer-solstice", () => {
    const before = buildQimenChart({
      gender: "女",
      datetime: "2024-06-19T12:00:00+08:00",
      timeIndex: 6,
    });
    const after = buildQimenChart({
      gender: "女",
      datetime: "2024-06-22T12:00:00+08:00",
      timeIndex: 6,
    });
    expect(before.dun).toBe("yang");
    expect(after.dun).toBe("yin");
  });

  it("changes solar-term across lichun boundary", () => {
    const before = buildQimenChart({
      gender: "男",
      datetime: "2024-02-03T12:00:00+08:00",
      timeIndex: 6,
    });
    const after = buildQimenChart({
      gender: "男",
      datetime: "2024-02-05T12:00:00+08:00",
      timeIndex: 6,
    });
    expect(before.solarTerm.name).toBe("大寒");
    expect(after.solarTerm.name).toBe("立春");
  });

  it("keeps late-zi in same day and records dayShift=0", () => {
    const lateZi = buildQimenChart({
      gender: "男",
      datetime: "2024-03-05T23:30:00+08:00",
      timeIndex: 0,
    });
    const sameDayEvening = buildQimenChart({
      gender: "男",
      datetime: "2024-03-05T21:30:00+08:00",
      timeIndex: 11,
    });
    const xunLateZi = readTrace(lateZi, "xun");
    const xunEvening = readTrace(sameDayEvening, "xun");
    expect(xunLateZi?.data?.dayStemBranch).toBe(xunEvening?.data?.dayStemBranch);
    expect(readTrace(lateZi, "late-zi")?.data).toMatchObject({
      ziHourRollover: "lateZi",
      dayShift: 0,
      lateZiWindow: true,
    });
  });

  it("handles cross-timezone input and keeps term/ju deterministic on same UTC instant", () => {
    const east8 = buildQimenChart({
      gender: "女",
      datetime: "2024-06-22T00:30:00+08:00",
      timeIndex: 0,
      location: { timeZone: "Asia/Shanghai" },
    });
    const utc5 = buildQimenChart({
      gender: "女",
      datetime: "2024-06-21T11:30:00-05:00",
      timeIndex: 6,
      location: { timeZone: "America/New_York" },
    });
    expect(east8.solarTerm.name).toBe(utc5.solarTerm.name);
    expect(east8.ju).toBe(utc5.ju);
    expect(east8.dun).toBe(utc5.dun);
    expect(utc5.rulesApplied.timezone).toBe("America/New_York");
  });
});

describe("qimen determinism and trace coverage", () => {
  it("returns the same chart for the same input and ruleset", () => {
    const input: QimenInput = {
      gender: "男",
      datetime: "2025-01-16T09:00:00+08:00",
      timeIndex: 5,
    };
    const first = buildQimenChart(input);
    const second = buildQimenChart(input);
    expect(first).toEqual(second);
  });

  it("includes required trace checkpoints", () => {
    const chart = buildQimenChart({
      gender: "女",
      datetime: "2025-02-18T14:00:00+08:00",
      timeIndex: 7,
    });
    expect(chart.trace.map((step) => step.key)).toEqual(
      expect.arrayContaining(["solar-term", "dun", "yuan", "ju-lookup", "zhi-fu-zhi-shi"]),
    );
    expect(readTrace(chart, "solar-term")?.data).toMatchObject({
      currentSolarTerm: expect.any(String),
      startUtcIso: expect.stringContaining("T"),
      nextUtcIso: expect.stringContaining("T"),
    });
    expect(readTrace(chart, "ju-lookup")?.data).toMatchObject({
      juTableId: "default_72",
      ju: expect.any(Number),
    });
  });
});
