import { buildChart, type BirthInfo, type EarthlyBranch } from "@ziwei/core";
import { describe, expect, it } from "vitest";

import { buildFlyMutagenState, computeFlyCurveGeometry, filterFlyMutagenState, sortMutagenTypes } from "./flyMutagen";

const SAMPLE_BIRTH: BirthInfo = {
  gender: "男",
  datetime: "1990-01-15T08:00:00",
  timeIndex: 4,
};

function createBranchCenters(): Record<EarthlyBranch, { x: number; y: number }> {
  return {
    子: { x: 0, y: 0 },
    丑: { x: 20, y: 0 },
    寅: { x: 40, y: 0 },
    卯: { x: 60, y: 0 },
    辰: { x: 80, y: 0 },
    巳: { x: 100, y: 0 },
    午: { x: 120, y: 0 },
    未: { x: 140, y: 0 },
    申: { x: 160, y: 0 },
    酉: { x: 180, y: 0 },
    戌: { x: 200, y: 0 },
    亥: { x: 220, y: 0 },
  };
}

describe("fly mutagen visuals", () => {
  it("sorts mutagen type by risk priority", () => {
    const sorted = sortMutagenTypes(["化禄", "化科", "化忌", "化权"]);
    expect(sorted).toEqual(["化忌", "化权", "化科", "化禄"]);
  });

  it("returns empty state when no palace selected", () => {
    const chart = buildChart(SAMPLE_BIRTH).chart;
    const state = buildFlyMutagenState(chart, [], createBranchCenters());
    expect(state.lines).toHaveLength(0);
    expect(state.inboundByPalace.size).toBe(0);
    expect(state.oppositeWarningPalaces.size).toBe(0);
  });

  it("builds 4 fly-mutation lines from selected palace stem", () => {
    const chart = buildChart(SAMPLE_BIRTH).chart;
    const selected = [chart.mingPalaceIndex];
    const state = buildFlyMutagenState(chart, selected, createBranchCenters());

    expect(state.lines).toHaveLength(4);
    expect(state.lines.every((line) => line.fromPalaceIndex === chart.mingPalaceIndex)).toBe(true);
    expect(state.lines.map((line) => line.type).sort()).toEqual(["化忌", "化权", "化科", "化禄"].sort());

    const jiLine = state.lines.find((line) => line.type === "化忌");
    expect(jiLine).toBeDefined();
    expect(jiLine?.label.includes("忌·")).toBe(true);
    expect(state.oppositeWarningPalaces.has(((jiLine?.toPalaceIndex ?? 0) + 6) % 12)).toBe(true);
  });

  it("filters fly lines by selected mutagen types", () => {
    const chart = buildChart(SAMPLE_BIRTH).chart;
    const state = buildFlyMutagenState(chart, [chart.mingPalaceIndex], createBranchCenters());
    const filtered = filterFlyMutagenState(state, new Set(["化忌", "化权"]));

    expect(filtered.lines).toHaveLength(2);
    expect(filtered.lines.map((line) => line.type).sort()).toEqual(["化忌", "化权"]);
    expect(filtered.oppositeWarningPalaces.size).toBe(1);
  });

  it("computes curve geometry with label near target palace", () => {
    const chart = buildChart(SAMPLE_BIRTH).chart;
    const state = buildFlyMutagenState(chart, [chart.mingPalaceIndex], createBranchCenters());
    const sample = state.lines[0];
    expect(sample).toBeDefined();
    const geometry = computeFlyCurveGeometry(sample!, {
      center: { x: 110, y: 0 },
      centerAvoidRadius: 80,
    });

    const labelToTarget = Math.hypot(geometry.label.x - geometry.to.x, geometry.label.y - geometry.to.y);
    const labelToSource = Math.hypot(geometry.label.x - geometry.from.x, geometry.label.y - geometry.from.y);
    expect(labelToTarget).toBeLessThan(labelToSource);
  });
});
