import type { MutagenType } from "@ziwei/core";

import { useChartStore } from "../../stores/chartStore";
import { LAYER_PRESET_OPTIONS } from "../../stores/layerPreset";
import { FLY_MUTAGEN_STYLE, FLY_MUTAGEN_TYPES } from "../chart/flyMutagen";

export default function LayerToggle() {
  const layers = useChartStore((s) => s.layers);
  const layerPreset = useChartStore((s) => s.layerPreset);
  const setLayerPreset = useChartStore((s) => s.setLayerPreset);
  const compactMode = useChartStore((s) => s.compactMode);
  const setCompactMode = useChartStore((s) => s.setCompactMode);
  const toggleLayer = useChartStore((s) => s.toggleLayer);
  const flyMutagenFilter = useChartStore((s) => s.flyMutagenFilter);
  const toggleFlyMutagenFilter = useChartStore((s) => s.toggleFlyMutagenFilter);
  const resetFlyMutagenFilter = useChartStore((s) => s.resetFlyMutagenFilter);

  const typeChipTone: Record<MutagenType, string> = {
    化禄: "border-emerald-700/70 text-emerald-200 hover:bg-emerald-900/55",
    化权: "border-amber-700/80 text-amber-200 hover:bg-amber-900/55",
    化科: "border-sky-700/80 text-sky-200 hover:bg-sky-900/55",
    化忌: "border-rose-700/80 text-rose-200 hover:bg-rose-900/55",
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="text-[11px] surface-label">预设</div>
        <div className="grid grid-cols-1 gap-2">
          {LAYER_PRESET_OPTIONS.map((p) => {
            const active = layerPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={[
                  "rounded-md border px-2 py-2 text-left",
                  active
                    ? "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200"
                    : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
                ].join(" ")}
                onClick={() => setLayerPreset(p.id)}
                title={p.desc}
              >
                <div className="text-xs font-semibold">{p.label}</div>
                <div className="mt-0.5 text-[10px] leading-relaxed surface-help">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
        <div className="flex flex-col">
          <span>简洁模式</span>
          <span className="text-[11px] surface-help">减少宫内信息密度（旧“极简”迁移）</span>
        </div>
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300 dark:border-slate-500"
          checked={compactMode}
          onChange={(event) => setCompactMode(event.target.checked)}
        />
      </label>

      <div className="space-y-2">
        <div className="text-[11px] surface-label">图层</div>

        <label className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <span>主星</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 dark:border-slate-500"
            checked={layers.majorStars}
            onChange={() => toggleLayer("majorStars")}
          />
        </label>

        <label className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <span>辅星 / 杂曜</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 dark:border-slate-500"
            checked={layers.minorStars}
            onChange={() => toggleLayer("minorStars")}
          />
        </label>

        <label className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <span>煞曜（擎羊/陀罗/火铃/空劫）</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 dark:border-slate-500"
            checked={layers.shaStars}
            onChange={() => toggleLayer("shaStars")}
            disabled={!layers.minorStars}
          />
        </label>

        <label className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <span>四化</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 dark:border-slate-500"
            checked={layers.mutagens}
            onChange={() => toggleLayer("mutagens")}
          />
        </label>

        {layers.mutagens ? (
          <div className="rounded-md border border-slate-600/80 bg-slate-900/55 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] surface-label">宫干飞化过滤（至少保留 1 项）</span>
              <button
                type="button"
                className="text-[11px] text-sky-500 hover:text-sky-400"
                onClick={() => resetFlyMutagenFilter()}
              >
                重置
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {FLY_MUTAGEN_TYPES.map((type) => {
                const active = flyMutagenFilter[type];
                const style = FLY_MUTAGEN_STYLE[type];
                return (
                  <button
                    key={type}
                    type="button"
                    className={[
                      "rounded border px-2 py-1 text-left text-[11px] font-semibold transition-colors",
                      typeChipTone[type],
                      active ? "bg-slate-900/55" : "bg-slate-900/20 opacity-100",
                    ].join(" ")}
                    onClick={() => toggleFlyMutagenFilter(type)}
                    title={`切换 ${type} 飞化线与入宫染色`}
                  >
                    <span>{type.replace("化", "")}</span>
                    <span className="ml-1 text-[10px]">
                      {active ? "显示" : "隐藏"}
                    </span>
                    <span className={`ml-1 rounded border px-1 py-[1px] text-[10px] ${style.badgeClass}`}>
                      {type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <label className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <span>三方四正结构线</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 dark:border-slate-500"
            checked={layers.relations}
            onChange={() => toggleLayer("relations")}
          />
        </label>

        <label className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <span>飞化箭头线</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 dark:border-slate-500"
            checked={layers.flyOverlay}
            onChange={() => toggleLayer("flyOverlay")}
            disabled={!layers.mutagens}
          />
        </label>

        <label className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <span>运限 / 流耀标记</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 dark:border-slate-500"
            checked={layers.decadal}
            onChange={() => toggleLayer("decadal")}
          />
        </label>
      </div>
    </div>
  );
}
