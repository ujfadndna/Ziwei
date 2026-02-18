import type { Chart, Palace, Star } from "@ziwei/core";

import { useMemo } from "react";

import { useChartStore } from "../../stores/chartStore";
import { isShaStarName } from "../chart/StarBadge";
import StarBadge from "../chart/StarBadge";

export interface StarDetailProps {
  chart: Chart;
  starName: string;
}

type StarOccurrence = { palace: Palace; star: Star };

function findOccurrences(chart: Chart, name: string): StarOccurrence[] {
  const hits: StarOccurrence[] = [];
  for (const palace of chart.palaces) {
    for (const star of palace.stars) {
      if (star.name === name) hits.push({ palace, star });
    }
  }
  return hits;
}

export default function StarDetail(props: StarDetailProps) {
  const { chart, starName } = props;

  const layers = useChartStore((s) => s.layers);
  const selectPalace = useChartStore((s) => s.selectPalace);
  const selectStar = useChartStore((s) => s.selectStar);

  const occurrences = useMemo(() => findOccurrences(chart, starName), [chart, starName]);
  const primary = occurrences[0] ?? null;

  if (!primary) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        未找到星曜：<span className="font-mono">{starName}</span>
      </div>
    );
  }

  const star = primary.star;
  const tone = isShaStarName(star.name) ? "煞曜" : star.type === "major" ? "主星" : star.type === "minor" ? "辅星" : "杂曜";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{star.name}</div>
          <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            类型：{tone}
            {star.brightness ? <> · 亮度：{star.brightness}</> : null}
            {star.mutagen ? <> · 四化：{star.mutagen.type}</> : null}
          </div>
        </div>
        <button
          type="button"
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-800"
          onClick={() => selectStar(star.name, { additive: false, palaceIndex: primary.palace.index })}
          title="在命盘中高亮/选中该星曜"
        >
          选中
        </button>
      </div>

      <div className="mt-3 space-y-2">
        <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">所在宫位</div>
        <div className="space-y-2">
          {occurrences.map((hit) => (
            <button
              key={`${hit.palace.branch ?? hit.palace.index}-${hit.star.name}`}
              type="button"
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-800"
              onClick={() => selectPalace(hit.palace.index, { additive: false })}
              title="跳转到该宫位"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">
                  {hit.palace.branch ?? "?"} · {hit.palace.name}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">索引 {hit.palace.index}</div>
              </div>
              <div className="mt-1">
                <StarBadge star={hit.star} showMutagen={layers.mutagens} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {star.tags && star.tags.length > 0 ? (
        <div className="mt-3">
          <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">标签</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {star.tags.map((t) => (
              <span
                key={t}
                className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-[10px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

