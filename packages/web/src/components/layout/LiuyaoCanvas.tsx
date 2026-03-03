import type { YinYang } from "@ziwei/core";

import { useMemo } from "react";

import { useChartStore } from "../../stores/chartStore";

function yaoSymbol(yinYang: YinYang): string {
  return yinYang === "阳" ? "─────" : "── ──";
}

function markerText(markers: string[]): string {
  const filtered = markers.filter(
    (item) => item !== "阳" && item !== "阴" && item !== "世" && item !== "应" && item !== "动" && item !== "变",
  );
  if (filtered.length === 0) return "—";
  return filtered.join(" · ");
}

export default function LiuyaoCanvas() {
  const liuyaoChart = useChartStore((s) => s.liuyaoChart);

  const displayLines = useMemo(() => {
    if (!liuyaoChart) return [];
    return [...liuyaoChart.lines].reverse();
  }, [liuyaoChart]);

  if (!liuyaoChart) {
    return (
      <main className="flex-1 min-w-0 overflow-hidden p-0.5">
        <div className="h-full rounded-xl ink-panel hud-corners p-2">
          <div className="h-full rounded-lg border border-dashed border-slate-600 bg-slate-950/55 p-6">
            <div className="text-sm font-semibold surface-value">尚未生成六爻排盘</div>
            <div className="mt-2 text-xs leading-relaxed surface-help">
              使用左侧出生信息点击「排盘」，系统会按 3-coin 规则生成本卦/变卦、卦宫世应、纳甲六亲、六神与旬空。
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 overflow-hidden p-0.5 motion-view-stage">
      <div className="h-full rounded-xl ink-panel hud-corners flex flex-col">
        <div className="px-2.5 py-1.5 flex items-center justify-between gap-2 border-b hud-divider-subtle">
          <div className="text-sm font-semibold">六爻（文王纳甲）</div>
          <div className="text-xs hud-badge" data-tone="accent">
            晚子不跨日 · 3-coin · 纳甲/世应/六神/旬空
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-2 space-y-2">
          <section className="grid grid-cols-1 gap-2 xl:grid-cols-[1fr_1fr_1.2fr]">
            <article className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
              <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">本卦</div>
              <div className="mt-1 text-lg font-semibold surface-value">{liuyaoChart.baseHexagram.name}</div>
              <div className="mt-1 text-xs surface-help">
                宫：{liuyaoChart.baseHexagram.palace} · 世{liuyaoChart.baseHexagram.shiLine} / 应{liuyaoChart.baseHexagram.yingLine}
              </div>
              <div className="mt-1 text-xs surface-help">
                上卦：{liuyaoChart.baseHexagram.upperTrigram} · 下卦：{liuyaoChart.baseHexagram.lowerTrigram}
              </div>
            </article>

            <article className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
              <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">变卦</div>
              <div className="mt-1 text-lg font-semibold surface-value">{liuyaoChart.changedHexagram.name}</div>
              <div className="mt-1 text-xs surface-help">
                宫：{liuyaoChart.changedHexagram.palace} · 世{liuyaoChart.changedHexagram.shiLine} / 应
                {liuyaoChart.changedHexagram.yingLine}
              </div>
              <div className="mt-1 text-xs surface-help">
                上卦：{liuyaoChart.changedHexagram.upperTrigram} · 下卦：{liuyaoChart.changedHexagram.lowerTrigram}
              </div>
            </article>

            <article className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
              <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">历法信息</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">月建 / 日辰</div>
                  <div className="mt-1 surface-value">
                    {liuyaoChart.lunarInfo.monthBuild} / {liuyaoChart.lunarInfo.dayChen}
                  </div>
                </div>
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">旬空</div>
                  <div className="mt-1 surface-value">
                    {liuyaoChart.xunkong.voidBranches.join("、")}（{liuyaoChart.xunkong.xun}旬）
                  </div>
                </div>
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">干支</div>
                  <div className="mt-1 surface-value">
                    {liuyaoChart.lunarInfo.ganzhi.year} / {liuyaoChart.lunarInfo.ganzhi.month} / {liuyaoChart.lunarInfo.ganzhi.day}
                  </div>
                </div>
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">时区</div>
                  <div className="mt-1 surface-value">{liuyaoChart.rulesApplied.timezone}</div>
                </div>
              </div>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            <article className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
              <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">本卦六爻（上→下）</div>
              <div className="mt-2 space-y-1.5">
                {displayLines.map((line) => {
                  const isShi = line.line.lineIndex === liuyaoChart.baseHexagram.shiLine;
                  const isYing = line.line.lineIndex === liuyaoChart.baseHexagram.yingLine;
                  const extraMarkers = markerText(line.base.markers);
                  return (
                    <div
                      key={`base-${line.line.lineIndex}`}
                      className="liuyao-line-card rounded-md px-2 py-1.5 text-xs"
                      data-shi={isShi ? "1" : "0"}
                      data-moving={line.line.moving ? "1" : "0"}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="liuyao-line-glyph text-base" data-yinyang={line.line.yinYang}>
                            {yaoSymbol(line.line.yinYang)}
                          </span>
                          <span className="hud-badge" data-tone={line.line.moving ? "risk" : undefined}>
                            {line.line.moving ? "动爻" : "静爻"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isShi ? (
                            <span className="hud-badge" data-tone="accent">
                              世
                            </span>
                          ) : null}
                          {isYing ? <span className="hud-badge">应</span> : null}
                          <span className="surface-help">第{line.line.lineIndex}爻</span>
                        </div>
                      </div>
                      <div className="mt-1 surface-help">
                        六神：{line.base.spirit} · 纳甲：{line.base.branch}（{line.base.element}） · 六亲：{line.base.relative}
                      </div>
                      <div className="mt-1 surface-help">
                        空亡：{line.base.isVoid ? "是" : "否"}
                        {extraMarkers === "—" ? "" : ` · 标记：${extraMarkers}`}
                      </div>
                      <div className="mt-1 surface-help">
                        投掷：{line.coinThrow.join(" / ")}（{line.coinSum}，{line.castLabel}）
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
              <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">变卦六爻（上→下）</div>
              <div className="mt-2 space-y-1.5">
                {displayLines.map((line) => {
                  const isShi = line.line.lineIndex === liuyaoChart.changedHexagram.shiLine;
                  const isYing = line.line.lineIndex === liuyaoChart.changedHexagram.yingLine;
                  const extraMarkers = markerText(line.changed.markers);
                  return (
                    <div
                      key={`changed-${line.line.lineIndex}`}
                      className="liuyao-line-card rounded-md px-2 py-1.5 text-xs"
                      data-shi={isShi ? "1" : "0"}
                      data-moving={line.line.moving ? "1" : "0"}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="liuyao-line-glyph text-base" data-yinyang={line.changedYinYang}>
                            {yaoSymbol(line.changedYinYang)}
                          </span>
                          <span className="hud-badge" data-tone={line.line.moving ? "risk" : undefined}>
                            {line.line.moving ? "由动爻变" : "静爻不变"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isShi ? (
                            <span className="hud-badge" data-tone="accent">
                              世
                            </span>
                          ) : null}
                          {isYing ? <span className="hud-badge">应</span> : null}
                          <span className="surface-help">第{line.line.lineIndex}爻</span>
                        </div>
                      </div>
                      <div className="mt-1 surface-help">
                        六神：{line.changed.spirit} · 纳甲：{line.changed.branch}（{line.changed.element}） · 六亲：
                        {line.changed.relative}
                      </div>
                      <div className="mt-1 surface-help">
                        空亡：{line.changed.isVoid ? "是" : "否"}
                        {extraMarkers === "—" ? "" : ` · 标记：${extraMarkers}`}
                      </div>
                      <div className="mt-1 surface-help">对应本爻：{line.line.moving ? "动爻变化" : "静爻不变"}</div>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          <details className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
            <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wide surface-label">
              Trace 调试面板（{liuyaoChart.trace.length} steps）
            </summary>
            <div className="mt-2 space-y-2">
              {liuyaoChart.trace.map((step) => (
                <article key={step.key} className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="surface-value">{step.title}</div>
                    <span className="font-mono text-[11px] surface-help">{step.key}</span>
                  </div>
                  <div className="mt-1 surface-help">{step.detail}</div>
                  {step.data ? (
                    <pre className="mt-1 overflow-auto rounded-md border border-slate-700/70 bg-slate-950/75 p-2 text-[11px] leading-relaxed surface-value">
                      {JSON.stringify(step.data, null, 2)}
                    </pre>
                  ) : null}
                </article>
              ))}
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
