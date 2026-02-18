import type { Chart, Palace, Star } from "@ziwei/core";

import { useMemo } from "react";

import { useChartStore } from "../../stores/chartStore";
import { isShaStarName } from "../chart/StarBadge";
import StarBadge from "../chart/StarBadge";

export interface PalaceDetailProps {
  chart: Chart;
  palace: Palace;
}

function sortStars(stars: readonly Star[]): Star[] {
  return [...stars].sort((a, b) => {
    const rank = (t: Star["type"]): number => (t === "major" ? 0 : t === "minor" ? 1 : 2);
    const ra = isShaStarName(a.name) ? 2 : rank(a.type);
    const rb = isShaStarName(b.name) ? 2 : rank(b.type);
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name, "zh-Hans");
  });
}

export default function PalaceDetail(props: PalaceDetailProps) {
  const { chart, palace } = props;

  const layers = useChartStore((s) => s.layers);
  const selection = useChartStore((s) => s.selection);
  const selectStar = useChartStore((s) => s.selectStar);
  const setHoveredStar = useChartStore((s) => s.setHoveredStar);

  const isMing = palace.name === "命宫";
  const isBody = chart.bodyPalaceIndex === palace.index;
  const isOrigin = chart.originPalaceIndex === palace.index;

  const stars = useMemo(() => sortStars(palace.stars), [palace.stars]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">
            {palace.branch ?? "?"} · {palace.name}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            索引：{palace.index} · 宫干：{palace.stem ?? "—"} · 干支：{palace.stemBranch ?? "—"}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isMing ? (
            <span className="rounded border border-emerald-200 bg-emerald-50 px-1 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
              命宫
            </span>
          ) : null}
          {isBody ? (
            <span className="rounded border border-violet-200 bg-violet-50 px-1 py-0.5 text-[10px] font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200">
              身宫
            </span>
          ) : null}
          {isOrigin ? (
            <span className="rounded border border-cyan-200 bg-cyan-50 px-1 py-0.5 text-[10px] font-semibold text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-200">
              来因宫
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">星曜</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {stars.map((star) => {
            // Inspector shows all stars, but respects "四化开关" for mutagen marker.
            const highlight = selection.selectedStars.includes(star.name) || selection.hoveredStar === star.name;

            return (
              <StarBadge
                key={`${palace.branch ?? palace.index}-${star.name}`}
                star={star}
                showMutagen={layers.mutagens}
                highlight={highlight}
                onMouseEnter={() => setHoveredStar(star.name, { palaceIndex: palace.index })}
                onMouseLeave={() => setHoveredStar(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  selectStar(star.name, { additive: e.shiftKey, palaceIndex: palace.index });
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
