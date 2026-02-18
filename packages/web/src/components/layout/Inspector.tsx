import type { Palace } from "@ziwei/core";

import { useMemo, type PointerEvent as ReactPointerEvent } from "react";

import { useChartStore } from "../../stores/chartStore";
import PalaceDetail from "../inspector/PalaceDetail";
import SearchBox from "../inspector/SearchBox";
import StarDetail from "../inspector/StarDetail";
import TraceViewer from "../inspector/TraceViewer";

interface InspectorProps {
  width: number;
  onResizeStart: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

export default function Inspector(props: InspectorProps) {
  const { width, onResizeStart } = props;
  const chart = useChartStore((s) => s.chart);
  const trace = useChartStore((s) => s.trace);
  const selection = useChartStore((s) => s.selection);
  const selectPalace = useChartStore((s) => s.selectPalace);

  const primaryPalace: Palace | null = useMemo(() => {
    if (!chart) return null;
    const idx = selection.selectedPalaces[0];
    if (idx == null) return null;
    return chart.palaces.find((p) => p.index === idx) ?? null;
  }, [chart, selection.selectedPalaces]);

  const primaryStarName: string | null = selection.selectedStars[0] ?? null;

  const keyPalaces = useMemo(() => {
    if (!chart) return [];
    const resolvePalace = (index: number | null | undefined): Palace | null => {
      if (index == null) return null;
      return chart.palaces.find((item) => item.index === index) ?? null;
    };
    return [
      { id: "ming", label: "命宫", palace: resolvePalace(chart.mingPalaceIndex) },
      { id: "body", label: "身宫", palace: resolvePalace(chart.bodyPalaceIndex) },
      { id: "origin", label: "来因宫", palace: resolvePalace(chart.originPalaceIndex) },
    ];
  }, [chart]);

  return (
    <aside
      data-surface="dark"
      className="relative shrink-0 overflow-auto border-l hud-divider-subtle p-3 hud-panel"
      style={{ width: `${width}px` }}
    >
      <div className="space-y-3">
        <div className="rounded-lg p-2 ink-soft hud-corners">
          <SearchBox />
        </div>

        {!chart ? (
          <div className="rounded-lg border border-dashed hud-divider-subtle hud-scrim p-3 text-xs surface-help">
            生成命盘后，这里将展示宫位/星曜详情以及推导日志。
          </div>
        ) : null}

        {chart && primaryStarName ? (
          <section className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-slate-300">
              <span className="surface-label">Star Detail</span>
            </div>
            <StarDetail chart={chart} starName={primaryStarName} />
          </section>
        ) : null}

        {chart && primaryPalace ? (
          <section className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-slate-300">
              <span className="surface-label">Palace Detail</span>
            </div>
            <PalaceDetail chart={chart} palace={primaryPalace} />
          </section>
        ) : null}

        {chart ? (
          <section className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-slate-300">
              <span className="surface-label">Key Palaces</span>
            </div>
            <div className="rounded-lg border hud-divider-subtle hud-scrim p-3">
              <div className="grid grid-cols-1 gap-2">
                {keyPalaces.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full rounded-md border hud-divider-subtle hud-scrim px-2 py-2 text-left text-sm font-semibold surface-value transition-colors motion-chip"
                    onClick={() => {
                      if (!item.palace) return;
                      selectPalace(item.palace.index, { additive: false });
                    }}
                    disabled={!item.palace}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{item.label}</span>
                      <span className="text-[11px] surface-help">
                        {item.palace ? `${item.palace.branch ?? "?"} · ${item.palace.name}` : "—"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {trace ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-slate-300">
                <span className="surface-label">Trace Log</span>
              </div>
              <div className="text-[11px] surface-help">
                {trace.steps.length} steps
              </div>
            </div>
            <TraceViewer trace={trace} />
          </section>
        ) : null}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="调整右侧详情区宽度"
        title="拖动调整右侧详情区宽度"
        className="hud-resize-handle absolute inset-y-0 -left-1 z-20 hidden lg:block"
        data-axis="x"
        data-side="start"
        onPointerDown={onResizeStart}
      />
    </aside>
  );
}
