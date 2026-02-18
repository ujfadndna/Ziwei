import type { HiddenStem } from "@ziwei/core";

import { useMemo } from "react";

import { useChartStore } from "../../stores/chartStore";

const MIN_SUPPORTED_YEAR = 1900;
const MAX_SUPPORTED_YEAR = 2100;
const ELEMENTS = ["木", "火", "土", "金", "水"] as const;

function clampYear(year: number): number {
  return Math.max(MIN_SUPPORTED_YEAR, Math.min(MAX_SUPPORTED_YEAR, Math.floor(year)));
}

function formatHiddenStems(items: HiddenStem[]): string {
  return items.map((item) => `${item.stem}${item.tenGod === "日主" ? "" : `(${item.tenGod})`}`).join(" · ");
}

export default function BaziCanvas() {
  const baziChart = useChartStore((s) => s.baziChart);
  const baziFlowYear = useChartStore((s) => s.baziFlowYear);
  const baziSelectedLuckIndex = useChartStore((s) => s.baziSelectedLuckIndex);
  const setBaziFlowYear = useChartStore((s) => s.setBaziFlowYear);
  const setBaziLuckIndex = useChartStore((s) => s.setBaziLuckIndex);
  const lastBirth = useChartStore((s) => s.lastBirth);

  const selectedLuck = useMemo(() => {
    if (!baziChart) return null;
    return baziChart.luck.pillars[baziSelectedLuckIndex] ?? baziChart.luck.pillars[0] ?? null;
  }, [baziChart, baziSelectedLuckIndex]);

  const flowYearChoices = useMemo(() => {
    const center = clampYear(baziFlowYear);
    return Array.from({ length: 11 }, (_, index) => clampYear(center - 5 + index));
  }, [baziFlowYear]);

  if (!baziChart) {
    return (
      <main className="flex-1 min-w-0 overflow-hidden p-0.5">
        <div className="h-full rounded-xl ink-panel hud-corners p-2">
          <div className="h-full rounded-lg border border-dashed border-slate-600 bg-slate-950/55 p-6">
            <div className="text-sm font-semibold surface-value">尚未生成八字</div>
            <div className="mt-2 text-xs leading-relaxed surface-help">
              使用左侧出生信息点击「排盘」，系统会自动生成四柱、藏干、十神、五行统计和大运流年。
            </div>
          </div>
        </div>
      </main>
    );
  }

  const maxElementCount = Math.max(...Object.values(baziChart.fiveElementsCount), 1);

  return (
    <main className="flex-1 min-w-0 overflow-hidden p-0.5 motion-view-stage">
      <div className="h-full rounded-xl ink-panel hud-corners flex flex-col">
        <div className="px-2.5 py-1.5 flex items-center justify-between gap-2 border-b hud-divider-subtle">
          <div className="text-sm font-semibold">八字</div>
          <div className="text-xs hud-badge" data-tone="accent">
            {baziChart.rulesApplied.yearBoundary === "lichun" ? "立春换年" : "换年口径"} · 晚子不跨日 · 节气定月
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-2 space-y-2">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1.45fr_1fr]">
            <section className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
              <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">四柱</div>
              <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
                {(
                  [
                    { key: "year", label: "年柱", data: baziChart.pillars.year },
                    { key: "month", label: "月柱", data: baziChart.pillars.month },
                    { key: "day", label: "日柱", data: baziChart.pillars.day },
                    { key: "hour", label: "时柱", data: baziChart.pillars.hour },
                  ] as const
                ).map((item) => {
                  const isDayMaster = item.key === "day";
                  return (
                    <article
                      key={item.key}
                      className={[
                        "rounded-md border px-2 py-2 bg-slate-950/55",
                        isDayMaster ? "border-sky-400/80" : "border-slate-600/70",
                      ].join(" ")}
                    >
                      <div className="text-[11px] surface-label">{item.label}</div>
                      <div className="mt-1 text-xl font-semibold leading-tight surface-value">{item.data.stemBranch}</div>
                      <div className="mt-1 text-[11px] surface-help">
                        天干 {item.data.stem} · 地支 {item.data.branch}
                      </div>
                      {isDayMaster ? <div className="mt-1 text-[11px] hud-badge is-active">日主 {baziChart.dayMaster}</div> : null}
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
              <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">五行 + 十神</div>
              <div className="mt-2 space-y-2">
                {ELEMENTS.map((element) => {
                  const count = baziChart.fiveElementsCount[element];
                  const ratio = (count / maxElementCount) * 100;
                  return (
                    <div key={element}>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="surface-value">{element}</span>
                        <span className="surface-help">{count}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full border border-slate-600/70 bg-slate-950/65">
                        <div
                          className="h-full rounded-full bg-sky-400/70"
                          style={{ width: `${Math.max(8, ratio)}%` }}
                          aria-hidden
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">年干十神</div>
                  <div className="mt-1 surface-value">{baziChart.tenGods.stems.year}</div>
                </div>
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">月干十神</div>
                  <div className="mt-1 surface-value">{baziChart.tenGods.stems.month}</div>
                </div>
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">日干十神</div>
                  <div className="mt-1 surface-value">{baziChart.tenGods.stems.day}</div>
                </div>
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">时干十神</div>
                  <div className="mt-1 surface-value">{baziChart.tenGods.stems.hour}</div>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">大运条带</div>
              <div className="text-[11px] surface-help">
                顺逆：{baziChart.luck.direction === "forward" ? "顺行" : "逆行"} · 起运：{baziChart.luck.startAge ?? 0} 岁
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-5">
              {baziChart.luck.pillars.map((item, index) => {
                const active = index === baziSelectedLuckIndex;
                return (
                  <button
                    key={`${item.index}-${item.stemBranch}`}
                    type="button"
                    className={[
                      "rounded-md border px-2 py-1.5 text-left transition-colors motion-chip",
                      active
                        ? "border-sky-400/80 bg-sky-900/35"
                        : "border-slate-600/70 bg-slate-950/55 hover:border-sky-500/50 hover:bg-slate-900/70",
                    ].join(" ")}
                    onClick={() => setBaziLuckIndex(index)}
                  >
                    <div className="text-[11px] surface-help">第 {item.index} 步</div>
                    <div className="text-base font-semibold leading-tight surface-value">{item.stemBranch}</div>
                    <div className="text-[11px] surface-help">
                      {item.startAge}~{item.endAge} 岁
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedLuck ? (
              <div className="mt-2 rounded-md border border-sky-500/45 bg-slate-950/70 px-2 py-1.5 text-xs">
                <span className="surface-value">当前大运：</span>
                <span className="surface-value font-semibold">{selectedLuck.stemBranch}</span>
                <span className="surface-help">（{selectedLuck.startYear}-{selectedLuck.endYear}，{selectedLuck.startAge}-{selectedLuck.endAge} 岁）</span>
              </div>
            ) : null}
          </section>

          <section className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">流年条带</div>
              <div className="text-[11px] surface-help">点击年份刷新流年干支</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {flowYearChoices.map((year) => {
                const active = year === baziFlowYear;
                return (
                  <button
                    key={year}
                    type="button"
                    className={[
                      "rounded-md border px-2 py-1 text-xs transition-colors motion-chip",
                      active
                        ? "border-sky-400/80 bg-sky-900/35 surface-value"
                        : "border-slate-600/70 bg-slate-950/55 surface-help hover:border-sky-500/50 hover:bg-slate-900/70",
                    ].join(" ")}
                    onClick={() => setBaziFlowYear(year)}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5 text-xs">
              <span className="surface-value">当前流年：</span>
              <span className="font-semibold surface-value">
                {baziChart.flow.year ? `${baziChart.flow.year.year} · ${baziChart.flow.year.stemBranch}` : "未指定"}
              </span>
              {lastBirth ? (
                <span className="ml-2 surface-help">出生：{lastBirth.datetime.replace("T", " ")}</span>
              ) : null}
            </div>
          </section>

          <details className="rounded-lg p-2 ink-soft hud-corners">
            <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wide surface-label">
              藏干与 trace 调试面板
            </summary>

            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-2 text-xs">
                  <div className="surface-label">年支藏干</div>
                  <div className="mt-1 surface-value">{formatHiddenStems(baziChart.hiddenStems.yearBranch)}</div>
                  <div className="mt-1 surface-label">月支藏干</div>
                  <div className="mt-1 surface-value">{formatHiddenStems(baziChart.hiddenStems.monthBranch)}</div>
                </div>
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-2 text-xs">
                  <div className="surface-label">日支藏干</div>
                  <div className="mt-1 surface-value">{formatHiddenStems(baziChart.hiddenStems.dayBranch)}</div>
                  <div className="mt-1 surface-label">时支藏干</div>
                  <div className="mt-1 surface-value">{formatHiddenStems(baziChart.hiddenStems.hourBranch)}</div>
                </div>
              </div>

              <div className="space-y-2">
                {baziChart.trace.map((step) => (
                  <article key={step.key} className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold surface-value">{step.title}</div>
                      <div className="surface-label">{step.key}</div>
                    </div>
                    <div className="mt-1 surface-help">{step.detail}</div>
                    {step.data ? (
                      <pre className="mt-1 overflow-auto rounded-md border border-slate-700/70 bg-slate-950/80 p-1.5 text-[11px] leading-relaxed surface-value">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
