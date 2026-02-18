import type { QimenPalace } from "@ziwei/core";

import { useMemo } from "react";

import { useChartStore } from "../../stores/chartStore";

const PALACE_GRID = [
  ["4", "9", "2"],
  ["3", "5", "7"],
  ["8", "1", "6"],
] as const;

const PALACE_LABELS: Record<string, string> = {
  "1": "坎",
  "2": "坤",
  "3": "震",
  "4": "巽",
  "5": "中",
  "6": "乾",
  "7": "兑",
  "8": "艮",
  "9": "离",
};

function getPalaceTone(palace: QimenPalace): string {
  if (palace.isZhiFu) return "border-emerald-400/75 bg-emerald-900/25";
  if (palace.isZhiShi) return "border-amber-400/70 bg-amber-900/20";
  if (palace.isXunKong) return "border-rose-400/65 bg-rose-900/15";
  return "border-slate-600/70 bg-slate-950/55";
}

export default function QimenCanvas() {
  const qimenChart = useChartStore((s) => s.qimenChart);

  const palaceRows = useMemo(() => {
    if (!qimenChart) return [];
    return PALACE_GRID.map((row) =>
      row.map((palaceId) => ({
        palaceId,
        data: qimenChart.palaces[palaceId],
      })),
    );
  }, [qimenChart]);

  if (!qimenChart) {
    return (
      <main className="flex-1 min-w-0 overflow-hidden p-0.5">
        <div className="h-full rounded-xl ink-panel hud-corners p-2">
          <div className="h-full rounded-lg border border-dashed border-slate-600 bg-slate-950/55 p-6">
            <div className="text-sm font-semibold surface-value">尚未生成奇门盘</div>
            <div className="mt-2 text-xs leading-relaxed surface-help">
              使用左侧出生信息点击「排盘」，系统会自动生成时家转盘奇门（节气、阴阳遁、三元、局数、值符值使、九宫）。
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
          <div className="text-sm font-semibold">奇门遁甲（时家转盘）</div>
          <div className="text-xs hud-badge" data-tone="accent">
            {qimenChart.dun === "yang" ? "阳遁" : "阴遁"}{qimenChart.ju}局 ·{" "}
            {qimenChart.yuan === "upper" ? "上元" : qimenChart.yuan === "middle" ? "中元" : "下元"}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-2 space-y-2">
          <section className="grid grid-cols-1 gap-2 xl:grid-cols-[1.25fr_1fr]">
            <div className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
              <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">节气与规则</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">当前节气</div>
                  <div className="mt-1 surface-value">
                    {qimenChart.solarTerm.name} · 第 {qimenChart.solarTerm.dayIndex} 天
                  </div>
                </div>
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">旬首 / 旬空</div>
                  <div className="mt-1 surface-value">
                    {qimenChart.xun.xunName}旬 · 旬首{qimenChart.xun.xunShou}
                  </div>
                  <div className="mt-1 surface-help">
                    旬空：{qimenChart.xun.xunKongBranches.join("、")}（宫 {qimenChart.xun.xunKongPalaces.join("、")}）
                  </div>
                </div>
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">值符</div>
                  <div className="mt-1 surface-value">
                    {qimenChart.zhiFuZhiShi.zhiFuStar} · {qimenChart.zhiFuZhiShi.zhiFuPalace}宫
                  </div>
                  <div className="mt-1 surface-help">原位：{qimenChart.zhiFuZhiShi.zhiFuSourcePalace}宫</div>
                </div>
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">值使</div>
                  <div className="mt-1 surface-value">
                    {qimenChart.zhiFuZhiShi.zhiShiDoor} · {qimenChart.zhiFuZhiShi.zhiShiPalace}宫
                  </div>
                  <div className="mt-1 surface-help">时区：{qimenChart.rulesApplied.timezone}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
              <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">节气时刻窗口（UTC）</div>
              <div className="mt-2 space-y-2 text-xs">
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">起始</div>
                  <div className="mt-1 surface-value font-mono text-[11px] leading-relaxed">
                    {qimenChart.solarTerm.startUtcIso}
                  </div>
                </div>
                <div className="rounded-md border border-slate-600/70 bg-slate-950/65 px-2 py-1.5">
                  <div className="surface-label">下一个节气</div>
                  <div className="mt-1 surface-value font-mono text-[11px] leading-relaxed">
                    {qimenChart.solarTerm.nextUtcIso}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
            <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">九宫盘</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {palaceRows.flatMap((row) =>
                row.map(({ palaceId, data }) => (
                  <article
                    key={palaceId}
                    className={[
                      "rounded-md border px-2 py-1.5 min-h-[110px] transition-colors",
                      data ? getPalaceTone(data) : "border-slate-600/70 bg-slate-950/55",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold surface-value">
                        {palaceId}宫 · {PALACE_LABELS[palaceId] ?? "—"}
                      </div>
                      {data?.isZhiFu ? <span className="hud-badge is-active">值符</span> : null}
                      {!data?.isZhiFu && data?.isZhiShi ? <span className="hud-badge" data-tone="warn">值使</span> : null}
                    </div>
                    {data ? (
                      <div className="mt-1 space-y-1 text-xs">
                        <div className="surface-value">
                          门：{data.door || "—"} · 星：{data.star || "—"}
                        </div>
                        <div className="surface-help">神：{data.god || "—"}</div>
                        <div className="surface-help">
                          天盘干：{data.tianPanStem} · 地盘干：{data.diPanStem}
                        </div>
                        {data.isXunKong ? (
                          <div className="text-[11px] text-rose-300">旬空宫</div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs surface-help">无数据</div>
                    )}
                  </article>
                )),
              )}
            </div>
          </section>

          <details className="rounded-lg p-2 ink-soft hud-corners hud-scrim">
            <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wide surface-label">
              Trace 调试面板（{qimenChart.trace.length} steps）
            </summary>
            <div className="mt-2 space-y-2">
              {qimenChart.trace.map((step) => (
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
