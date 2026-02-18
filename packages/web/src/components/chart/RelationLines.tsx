import { 地支, type Chart, type EarthlyBranch } from "@ziwei/core";

type Point = { x: number; y: number };

export interface RelationLinesProps {
  chart: Chart;
  activePalaceIndex: number | null;
  branchCenters: Record<EarthlyBranch, Point>;
  dimmed?: boolean;
}

export default function RelationLines(props: RelationLinesProps) {
  const { chart, activePalaceIndex, branchCenters, dimmed = false } = props;

  if (activePalaceIndex == null) return null;
  const activePalace = chart.palaces.find((p) => p.index === activePalaceIndex);
  if (!activePalace?.branch) return null;

  const activeBranch = activePalace.branch;
  const activeBranchIndex = 地支.indexOf(activeBranch);
  if (activeBranchIndex < 0) return null;

  const opposite = 地支[(activeBranchIndex + 6) % 12] as EarthlyBranch;
  const triadA = 地支[(activeBranchIndex + 4) % 12] as EarthlyBranch;
  const triadB = 地支[(activeBranchIndex + 8) % 12] as EarthlyBranch;

  const src = branchCenters[activeBranch];
  const dstOpp = branchCenters[opposite];
  const dstA = branchCenters[triadA];
  const dstB = branchCenters[triadB];

  return (
    <g opacity={dimmed ? 0.35 : 0.9} pointerEvents="none">
      {/* Opposite */}
      <line
        x1={src.x}
        y1={src.y}
        x2={dstOpp.x}
        y2={dstOpp.y}
        stroke="var(--bad)"
        strokeWidth={2}
        strokeDasharray="4 4"
        className="hud-overlay-draw"
        pathLength={1}
      />

      {/* Triads */}
      <line
        x1={src.x}
        y1={src.y}
        x2={dstA.x}
        y2={dstA.y}
        stroke="var(--accent)"
        strokeWidth={2}
        className="hud-overlay-draw"
        pathLength={1}
      />
      <line
        x1={src.x}
        y1={src.y}
        x2={dstB.x}
        y2={dstB.y}
        stroke="var(--accent)"
        strokeWidth={2}
        className="hud-overlay-draw"
        pathLength={1}
      />
    </g>
  );
}
