import { describe, expect, it } from "vitest";

import { buildBaziChart } from "./index";
import type { BaziInput } from "../types";

interface GoldenFixture {
  name: string;
  input: BaziInput;
}

const GOLDEN_FIXTURES: GoldenFixture[] = [
  {
    name: "male-1990-morning",
    input: {
      gender: "男",
      datetime: "1990-01-15T08:00:00+08:00",
      timeIndex: 4,
      flowYear: 2026,
    },
  },
  {
    name: "female-1985-afternoon",
    input: {
      gender: "女",
      datetime: "1985-06-20T14:00:00+08:00",
      timeIndex: 7,
      flowYear: 2028,
    },
  },
  {
    name: "before-lichun-2024",
    input: {
      gender: "男",
      datetime: "2024-02-03T10:00:00+08:00",
      timeIndex: 5,
      flowYear: 2024,
    },
  },
  {
    name: "after-lichun-2024",
    input: {
      gender: "男",
      datetime: "2024-02-04T10:00:00+08:00",
      timeIndex: 5,
      flowYear: 2024,
    },
  },
  {
    name: "new-york-timezone",
    input: {
      gender: "女",
      datetime: "2024-01-15T20:30:00-05:00",
      timeIndex: 10,
      flowYear: 2029,
      location: {
        timeZone: "America/New_York",
      },
    },
  },
];

function readTraceStep(chart: ReturnType<typeof buildBaziChart>, key: string) {
  return chart.trace.find((step) => step.key === key);
}

describe("buildBaziChart golden fixtures", () => {
  for (const fixture of GOLDEN_FIXTURES) {
    it(`matches golden snapshot: ${fixture.name}`, () => {
      const chart = buildBaziChart(fixture.input);
      expect({
        pillars: {
          year: chart.pillars.year.stemBranch,
          month: chart.pillars.month.stemBranch,
          day: chart.pillars.day.stemBranch,
          hour: chart.pillars.hour.stemBranch,
        },
        dayMaster: chart.dayMaster,
        flowYear: chart.flow.year,
        luckDirection: chart.luck.direction,
        luckStartAge: chart.luck.startAge,
        firstLuckPillar: chart.luck.pillars[0]?.stemBranch ?? null,
      }).toMatchSnapshot();
    });
  }
});

describe("buildBaziChart boundary behavior", () => {
  it("uses lichun year boundary and records trace decision", () => {
    const before = buildBaziChart({
      gender: "男",
      datetime: "2024-02-03T10:00:00+08:00",
      timeIndex: 5,
    });
    const after = buildBaziChart({
      gender: "男",
      datetime: "2024-02-04T10:00:00+08:00",
      timeIndex: 5,
    });
    expect(before.pillars.year.stemBranch).not.toBe(after.pillars.year.stemBranch);

    const beforeBoundary = readTraceStep(before, "year-boundary");
    const afterBoundary = readTraceStep(after, "year-boundary");
    expect(beforeBoundary).toBeDefined();
    expect(afterBoundary).toBeDefined();
    expect(beforeBoundary?.data).toMatchObject({ passedLichun: false });
    expect(afterBoundary?.data).toMatchObject({ passedLichun: true });
  });

  it("keeps late-zi within same day and records day-shift as zero", () => {
    const lateZi = buildBaziChart({
      gender: "男",
      datetime: "2024-03-05T23:30:00+08:00",
      timeIndex: 0,
    });
    const sameDayEvening = buildBaziChart({
      gender: "男",
      datetime: "2024-03-05T21:30:00+08:00",
      timeIndex: 11,
    });
    expect(lateZi.pillars.day.stemBranch).toBe(sameDayEvening.pillars.day.stemBranch);
    const lateZiStep = readTraceStep(lateZi, "late-zi");
    expect(lateZiStep?.data).toMatchObject({
      ziHourRollover: "lateZi",
      dayShift: 0,
      lateZiWindow: true,
    });
  });

  it("records timezone and required trace steps", () => {
    const chart = buildBaziChart({
      gender: "女",
      datetime: "2024-01-15T20:30:00-05:00",
      timeIndex: 10,
      location: {
        timeZone: "America/New_York",
      },
      flowYear: 2029,
    });
    expect(chart.rulesApplied.timezone).toBe("America/New_York");
    expect(chart.trace.map((step) => step.key)).toEqual(
      expect.arrayContaining([
        "timezone",
        "year-boundary",
        "month-boundary",
        "late-zi",
        "luck",
      ])
    );
  });
});
