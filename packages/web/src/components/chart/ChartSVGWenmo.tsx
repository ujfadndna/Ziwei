import { 地支, type Chart, type EarthlyBranch, type Palace, type Star } from "@ziwei/core";
import { useMemo } from "react";

import { useChartStore } from "../../stores/chartStore";
import type { LayerState } from "../../types/ui";
import {
  buildCycleYearRow,
  buildCycleSnapshot,
  getVirtualAgeByYear,
  getYearByVirtualAge,
  readDecadalOverview,
} from "../../utils/cycleTimeline";
import {
  buildFlyMutagenState,
  computeFlyCurveGeometry,
  filterFlyMutagenState,
  FLY_MUTAGEN_KEY,
  FLY_MUTAGEN_STYLE,
  FLY_MUTAGEN_TYPES,
} from "./flyMutagen";
import { isShaStarName } from "./StarBadge";
import PalaceCell from "./PalaceCell";
import RelationLines from "./RelationLines";

type GridPos = { row: number; col: number };
type Point = { x: number; y: number };
type CursorPoint = { age: number; year: number; month: number; day: number; hour: number };
const EMPTY_MARKERS: ReadonlyArray<{ id: string; label: string }> = [];
const EMPTY_STARS: ReadonlyArray<string> = [];
const EMPTY_FLY_MUTAGENS: ReadonlyArray<{ type: "化禄" | "化权" | "化科" | "化忌"; star: string }> = [];
const EMPTY_AGES: ReadonlyArray<number> = [];

const BRANCH_GRID_POS: Record<EarthlyBranch, GridPos> = {
  巳: { row: 0, col: 0 },
  午: { row: 0, col: 1 },
  未: { row: 0, col: 2 },
  申: { row: 0, col: 3 },

  辰: { row: 1, col: 0 },
  酉: { row: 1, col: 3 },

  卯: { row: 2, col: 0 },
  戌: { row: 2, col: 3 },

  寅: { row: 3, col: 0 },
  丑: { row: 3, col: 1 },
  子: { row: 3, col: 2 },
  亥: { row: 3, col: 3 },
};

const CELL_SIZE = 100;
const SVG_SIZE = CELL_SIZE * 4;

function getVisibleStars(stars: readonly Star[], layers: LayerState): Star[] {
  const filtered = stars.filter((star) => {
    if (star.type === "major") return layers.majorStars;

    const isMinorLike = star.type === "minor" || star.type === "adjective";
    if (isMinorLike) {
      if (!layers.minorStars) return false;
      if (!layers.shaStars && isShaStarName(star.name)) return false;
      return true;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    const rank = (t: Star["type"]): number => (t === "major" ? 0 : t === "minor" ? 1 : 2);
    const ra = rank(a.type);
    const rb = rank(b.type);
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name, "zh-Hans");
  });
}

function formatSolarDate(chart: Chart): string {
  const { year, month, day } = chart.date.solar;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatLunarDate(chart: Chart): string {
  const { year, month, day, isLeap } = chart.date.lunar;
  return `${year}年 ${isLeap ? "闰" : ""}${month}月${day}日`;
}

function toDate(year: number, month: number, day: number, hour: number): Date {
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

function fromDate(date: Date): Omit<CursorPoint, "age"> {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
  };
}

function getPreviousCursorPoint(mode: string, current: CursorPoint, birthYear: number): CursorPoint | null {
  if (mode === "natal") return null;

  if (mode === "decadal" || mode === "small" || mode === "yearly") {
    const prevAge = Math.max(1, current.age - 1);
    return {
      age: prevAge,
      year: getYearByVirtualAge(birthYear, prevAge),
      month: current.month,
      day: current.day,
      hour: current.hour,
    };
  }

  if (mode === "monthly" || mode === "daily" || mode === "hourly") {
    const date = toDate(current.year, current.month, current.day, current.hour);
    if (mode === "monthly") date.setMonth(date.getMonth() - 1);
    if (mode === "daily") date.setDate(date.getDate() - 1);
    if (mode === "hourly") date.setHours(date.getHours() - 1);
    const next = fromDate(date);
    return {
      ...next,
      age: getVirtualAgeByYear(birthYear, next.year),
    };
  }

  return null;
}

function mutagenSummary(items: Array<{ type: string; star: string }> | null | undefined): string {
  if (!items || items.length === 0) return "无";
  return items.map((item) => `${item.type}${item.star}`).join("、");
}

function getSanheBranches(branch: EarthlyBranch): readonly [EarthlyBranch, EarthlyBranch, EarthlyBranch, EarthlyBranch] {
  const index = 地支.indexOf(branch);
  if (index < 0) return [branch, branch, branch, branch];
  return [branch, 地支[(index + 6) % 12] as EarthlyBranch, 地支[(index + 4) % 12] as EarthlyBranch, 地支[(index + 8) % 12] as EarthlyBranch];
}

export default function ChartSVGWenmo() {
  const chart = useChartStore((s) => s.chart);
  const layers = useChartStore((s) => s.layers);
  const selection = useChartStore((s) => s.selection);
  const searchResult = useChartStore((s) => s.searchResult);
  const timeline = useChartStore((s) => s.timeline);
  const viewMode = useChartStore((s) => s.viewMode);
  const flyMutagenFilter = useChartStore((s) => s.flyMutagenFilter);

  const activePalaceIndex = selection.hoveredPalace ?? selection.selectedPalaces[0] ?? null;
  const palaces = chart?.palaces ?? [];
  const flySourcePalaces = useMemo(
    () => (selection.selectedPalaces.length ? selection.selectedPalaces : selection.hoveredPalace != null ? [selection.hoveredPalace] : []),
    [selection.selectedPalaces, selection.hoveredPalace]
  );

  const palaceByBranch = useMemo(() => {
    const map = new Map<EarthlyBranch, Palace>();
    for (const p of palaces) {
      if (p.branch) map.set(p.branch, p);
    }
    return map;
  }, [palaces]);

  const branchCenters = useMemo(() => {
    const map = {} as Record<EarthlyBranch, Point>;
    for (const branch of 地支) {
      const pos = BRANCH_GRID_POS[branch];
      map[branch] = {
        x: (pos.col + 0.5) * CELL_SIZE,
        y: (pos.row + 0.5) * CELL_SIZE,
      };
    }
    return map;
  }, []);

  const cycleSnapshot = useMemo(
    () =>
      buildCycleSnapshot(chart, {
        age: timeline.age,
        year: timeline.year,
        month: timeline.month,
        day: timeline.day,
        hour: timeline.hour,
      }),
    [chart, timeline.age, timeline.year, timeline.month, timeline.day, timeline.hour]
  );

  const previousCycleSnapshot = useMemo(() => {
    if (!chart) return null;
    const prevCursor = getPreviousCursorPoint(
      timeline.mode,
      {
        age: timeline.age,
        year: timeline.year,
        month: timeline.month,
        day: timeline.day,
        hour: timeline.hour,
      },
      chart.date.solar.year
    );
    if (!prevCursor) return null;
    return buildCycleSnapshot(chart, prevCursor);
  }, [chart, timeline.mode, timeline.age, timeline.year, timeline.month, timeline.day, timeline.hour]);

  const cycleMarkersByPalace = useMemo(() => {
    const map = new Map<number, Array<{ id: string; label: string }>>();
    if (!layers.decadal || !cycleSnapshot) return map;

    const push = (palaceIndex: number | null | undefined, marker: { id: string; label: string }) => {
      if (palaceIndex == null) return;
      const current = map.get(palaceIndex) ?? [];
      if (current.some((item) => item.id === marker.id)) return;
      map.set(palaceIndex, [...current, marker]);
    };

    push(cycleSnapshot.yearly?.decadalPalaceIndex, { id: "decadal", label: "大" });
    push(cycleSnapshot.yearly?.smallLimitPalaceIndex, { id: "small", label: "小" });
    push(cycleSnapshot.yearly?.yearlyPalaceIndex, { id: "yearly", label: "年" });

    return map;
  }, [layers.decadal, cycleSnapshot]);

  const flowStarsByPalace = useMemo(() => {
    const map = new Map<number, string[]>();
    if (!layers.decadal || !cycleSnapshot?.yearly?.yearlyStars) return map;

    for (const star of cycleSnapshot.yearly.yearlyStars) {
      const current = map.get(star.palaceIndex) ?? [];
      if (current.includes(star.name)) continue;
      map.set(star.palaceIndex, [...current, star.name]);
    }

    return map;
  }, [layers.decadal, cycleSnapshot?.yearly?.yearlyStars]);

  const palaceAgeSummary = useMemo(() => {
    const yearlyAgesByPalace = new Map<number, number[]>();
    const smallAgesByPalace = new Map<number, number[]>();
    const decadalRangeByPalace = new Map<number, { startAge: number; endAge: number }>();

    if (!chart) return { yearlyAgesByPalace, smallAgesByPalace, decadalRangeByPalace };

    const decadals = readDecadalOverview(chart);
    for (const decadal of decadals) {
      decadalRangeByPalace.set(decadal.palaceIndex, {
        startAge: decadal.startAge,
        endAge: decadal.endAge,
      });
    }

    const maxAge = decadals[decadals.length - 1]?.endAge ?? 120;
    for (let age = 1; age <= maxAge; age += 1) {
      let row = null;
      try {
        row = buildCycleYearRow(chart, decadals, age);
      } catch {
        // Some calendar conversions may not support very far future years; stop gracefully.
        break;
      }
      if (!row) continue;

      const yearly = yearlyAgesByPalace.get(row.yearlyPalaceIndex) ?? [];
      yearlyAgesByPalace.set(row.yearlyPalaceIndex, [...yearly, row.age]);

      const small = smallAgesByPalace.get(row.smallLimitPalaceIndex) ?? [];
      smallAgesByPalace.set(row.smallLimitPalaceIndex, [...small, row.age]);
    }

    return { yearlyAgesByPalace, smallAgesByPalace, decadalRangeByPalace };
  }, [chart]);

  const flyMutagenState = useMemo(() => {
    if (!chart || !layers.mutagens || !flySourcePalaces.length) {
      return { lines: [], inboundByPalace: new Map(), oppositeWarningPalaces: new Set<number>() };
    }
    return buildFlyMutagenState(chart, flySourcePalaces, branchCenters);
  }, [chart, branchCenters, flySourcePalaces, layers.mutagens]);

  const enabledFlyTypeSet = useMemo(
    () => new Set(FLY_MUTAGEN_TYPES.filter((type) => flyMutagenFilter[type])),
    [flyMutagenFilter]
  );

  const filteredFlyMutagenState = useMemo(
    () => filterFlyMutagenState(flyMutagenState, enabledFlyTypeSet),
    [flyMutagenState, enabledFlyTypeSet]
  );

  const flyMutagenLines = filteredFlyMutagenState.lines;
  const flyInboundByPalace = filteredFlyMutagenState.inboundByPalace;
  const flyOppositeWarningPalaces = filteredFlyMutagenState.oppositeWarningPalaces;
  const hasFlyOverlay = layers.flyOverlay && flyMutagenLines.length > 0;

  const sanheFocusPalaces = useMemo(() => {
    const focus = new Set<number>();
    if (!layers.relations || activePalaceIndex == null) return focus;
    const activePalace = chart?.palaces.find((item) => item.index === activePalaceIndex);
    if (!activePalace?.branch) return focus;
    const branches = getSanheBranches(activePalace.branch);
    for (const branch of branches) {
      const palace = palaceByBranch.get(branch);
      if (palace) focus.add(palace.index);
    }
    return focus;
  }, [activePalaceIndex, chart?.palaces, layers.relations, palaceByBranch]);

  const sanheSummary = useMemo(() => {
    if (!layers.relations || activePalaceIndex == null) return null;
    const activePalace = chart?.palaces.find((item) => item.index === activePalaceIndex);
    if (!activePalace?.branch) return null;
    const [, oppositeBranch, triadABranch, triadBBranch] = getSanheBranches(activePalace.branch);
    const oppositePalace = palaceByBranch.get(oppositeBranch);
    const triadA = palaceByBranch.get(triadABranch);
    const triadB = palaceByBranch.get(triadBBranch);
    if (!oppositePalace || !triadA || !triadB) return null;
    return `${activePalace.name} · 对宫${oppositePalace.name} · 三方${triadA.name}/${triadB.name}`;
  }, [activePalaceIndex, chart?.palaces, layers.relations, palaceByBranch]);

  const cycleChangedPalaceSet = useMemo(() => {
    const changed = new Set<number>();
    if (!layers.decadal || viewMode !== "diff" || !cycleSnapshot || !previousCycleSnapshot) return changed;

    const pairs: Array<{
      prev: number | null | undefined;
      next: number | null | undefined;
    }> = [
      { prev: previousCycleSnapshot.yearly?.decadalPalaceIndex, next: cycleSnapshot.yearly?.decadalPalaceIndex },
      { prev: previousCycleSnapshot.yearly?.smallLimitPalaceIndex, next: cycleSnapshot.yearly?.smallLimitPalaceIndex },
      { prev: previousCycleSnapshot.yearly?.yearlyPalaceIndex, next: cycleSnapshot.yearly?.yearlyPalaceIndex },
      { prev: previousCycleSnapshot.monthly?.monthlyPalaceIndex, next: cycleSnapshot.monthly?.monthlyPalaceIndex },
      { prev: previousCycleSnapshot.daily?.dailyPalaceIndex, next: cycleSnapshot.daily?.dailyPalaceIndex },
      { prev: previousCycleSnapshot.hourly?.hourlyPalaceIndex, next: cycleSnapshot.hourly?.hourlyPalaceIndex },
    ];

    for (const pair of pairs) {
      if (pair.prev == null || pair.next == null || pair.prev === pair.next) continue;
      changed.add(pair.prev);
      changed.add(pair.next);
    }

    return changed;
  }, [layers.decadal, viewMode, cycleSnapshot, previousCycleSnapshot]);

  if (!chart) return null;

  return (
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label="紫微斗数命盘"
    >
      <rect x={0} y={0} width={SVG_SIZE} height={SVG_SIZE} fill="transparent" />

      {Array.from({ length: 5 }).map((_, i) => {
        const p = i * CELL_SIZE;
        return (
          <g key={`grid-${i}`} opacity={0.35}>
            <line x1={0} y1={p} x2={SVG_SIZE} y2={p} stroke="currentColor" className="text-zinc-300 dark:text-slate-600" />
            <line x1={p} y1={0} x2={p} y2={SVG_SIZE} stroke="currentColor" className="text-zinc-300 dark:text-slate-600" />
          </g>
        );
      })}

      <g>
        <rect
          x={CELL_SIZE}
          y={CELL_SIZE}
          width={CELL_SIZE * 2}
          height={CELL_SIZE * 2}
          rx={10}
          fill="currentColor"
          className="text-slate-900"
        />
      </g>

      {地支.map((branch, branchIndex) => {
        const pos = BRANCH_GRID_POS[branch];
        const palace = palaceByBranch.get(branch);
        if (!pos || !palace) return null;

        const visibleStars = getVisibleStars(palace.stars, layers);
        const isPalaceSelected = selection.selectedPalaces.includes(palace.index);
        const isPalaceHovered = selection.hoveredPalace === palace.index;
        const isSearchPalace = searchResult?.palaceIndex === palace.index;
        const hasSelectedStar = visibleStars.some((s) => selection.selectedStars.includes(s.name));
        const isMing = palace.name === "命宫";
        const isBody = chart.bodyPalaceIndex === palace.index;
        const isOrigin = chart.originPalaceIndex === palace.index;

        const x = pos.col * CELL_SIZE;
        const y = pos.row * CELL_SIZE;

        return (
          <PalaceCell
            key={`${palace.name}-${branch}`}
            palace={palace}
            x={x}
            y={y}
            size={CELL_SIZE}
            stars={visibleStars}
            isMing={isMing}
            isBody={isBody}
            isOrigin={isOrigin}
            isSelected={isPalaceSelected}
            isHovered={isPalaceHovered}
            isSearchHit={isSearchPalace}
            hasSelectedStar={hasSelectedStar}
            searchHitStarName={isSearchPalace ? searchResult?.starName ?? null : null}
            cycleMarkers={cycleMarkersByPalace.get(branchIndex) ?? EMPTY_MARKERS}
            currentFlowStars={flowStarsByPalace.get(branchIndex) ?? EMPTY_STARS}
            flyInMutagens={flyInboundByPalace.get(palace.index) ?? EMPTY_FLY_MUTAGENS}
            yearlyAges={palaceAgeSummary.yearlyAgesByPalace.get(branchIndex) ?? EMPTY_AGES}
            smallLimitAges={palaceAgeSummary.smallAgesByPalace.get(branchIndex) ?? EMPTY_AGES}
            decadalRange={palaceAgeSummary.decadalRangeByPalace.get(branchIndex) ?? null}
            isRelationFocus={sanheFocusPalaces.has(palace.index)}
            isOppositeWarning={flyOppositeWarningPalaces.has(palace.index)}
            isCycleChanged={cycleChangedPalaceSet.has(branchIndex)}
          />
        );
      })}

      {layers.relations ? (
        <RelationLines
          chart={chart}
          activePalaceIndex={activePalaceIndex}
          branchCenters={branchCenters}
          dimmed={hasFlyOverlay}
        />
      ) : null}

      <g>
        <foreignObject x={CELL_SIZE} y={CELL_SIZE} width={CELL_SIZE * 2} height={CELL_SIZE * 2}>
          <div className="h-full w-full p-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="text-xs font-semibold surface-value">Ziwei</div>
              <div className="text-[11px] surface-help">{formatSolarDate(chart)}</div>
              <div className="text-[11px] surface-help">{formatLunarDate(chart)}</div>
              <div className="text-[11px] surface-help">
                干支：{chart.date.ganzhi.year} / {chart.date.ganzhi.month} / {chart.date.ganzhi.day}
              </div>
              <div className="text-[10px] surface-help">
                命:{chart.palaces[chart.mingPalaceIndex]?.name ?? "—"} · 身:
                {chart.bodyPalaceIndex != null ? chart.palaces[chart.bodyPalaceIndex]?.name ?? "—" : "—"} · 来:
                {chart.originPalaceIndex != null ? chart.palaces[chart.originPalaceIndex]?.name ?? "—" : "—"}
              </div>
              {sanheSummary ? <div className="text-[10px] surface-help">三方四正：{sanheSummary}</div> : null}
              <div className="text-[10px] surface-help">
                年四化：{mutagenSummary(cycleSnapshot?.yearly?.yearlyMutagens ?? null)}
              </div>
            </div>
            <div className="text-[11px] surface-help">
              提示：Shift+Click 多选 · Esc 清空 · 点击宫位看宫干飞化
            </div>
          </div>
        </foreignObject>
      </g>

      {hasFlyOverlay ? (
        <g pointerEvents="none" opacity={0.96}>
          <defs>
            {(Object.entries(FLY_MUTAGEN_STYLE) as Array<[keyof typeof FLY_MUTAGEN_STYLE, (typeof FLY_MUTAGEN_STYLE)[keyof typeof FLY_MUTAGEN_STYLE]]>).map(
              ([type, style]) => (
                <marker
                  key={`arrow-${type}`}
                  id={`fly-arrow-${FLY_MUTAGEN_KEY[type]}`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L6,3 z" fill={style.stroke} />
                </marker>
              )
            )}
          </defs>

          {flyMutagenLines.map((line) => {
            const style = FLY_MUTAGEN_STYLE[line.type];
            const geometry = computeFlyCurveGeometry(line, {
              center: { x: SVG_SIZE / 2, y: SVG_SIZE / 2 },
              centerAvoidRadius: 132,
            });
            const labelWidth = line.label.length * 8 + 10;

            return (
              <g key={line.id}>
                <path
                  d={`M ${geometry.from.x} ${geometry.from.y} Q ${geometry.control.x} ${geometry.control.y} ${geometry.to.x} ${geometry.to.y}`}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={Math.max(1.1, style.strokeWidth - 0.4)}
                  strokeLinecap="round"
                  className="hud-overlay-draw"
                  pathLength={1}
                  opacity={0.78}
                />
                <path
                  d={`M ${geometry.from.x} ${geometry.from.y} Q ${geometry.control.x} ${geometry.control.y} ${geometry.to.x} ${geometry.to.y}`}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  strokeDasharray={style.strokeDasharray}
                  strokeLinecap="round"
                  markerEnd={`url(#fly-arrow-${FLY_MUTAGEN_KEY[line.type]})`}
                />
                <circle cx={geometry.to.x} cy={geometry.to.y} r={2.5} fill={style.stroke} />
                <g transform={`translate(${geometry.label.x}, ${geometry.label.y})`}>
                  <rect
                    x={-2}
                    y={-10}
                    width={labelWidth}
                    height={16}
                    rx={4}
                    fill="rgba(2, 6, 23, 0.92)"
                    stroke={style.stroke}
                    strokeWidth={1}
                  />
                  <text x={2} y={1} className="text-[10px] font-semibold" fill="#e2e8f0">
                    {line.label}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      ) : null}
    </svg>
  );
}
