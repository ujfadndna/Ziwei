import { useMemo } from "react";

import { useChartStore } from "../../stores/chartStore";
import { buildCycleSnapshot, findDecadalByAge, getPalaceLabel, getYearByVirtualAge } from "../../utils/cycleTimeline";

function mutagenBrief(items: Array<{ type: string; star: string }>): string {
  return items.map((item) => `${item.type}${item.star}`).join("、");
}

export default function CycleAtGlance() {
  const chart = useChartStore((s) => s.chart);
  const timeline = useChartStore((s) => s.timeline);
  const setTimeline = useChartStore((s) => s.setTimeline);
  const selectPalace = useChartStore((s) => s.selectPalace);
  const setLayers = useChartStore((s) => s.setLayers);

  const snapshot = useMemo(
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

  const previousYearly = useMemo(() => {
    if (!chart || timeline.age <= 1) return null;
    return buildCycleSnapshot(chart, {
      age: timeline.age - 1,
      year: getYearByVirtualAge(chart.date.solar.year, timeline.age - 1),
      month: timeline.month,
      day: timeline.day,
      hour: timeline.hour,
    })?.yearly;
  }, [chart, timeline.age, timeline.month, timeline.day, timeline.hour]);

  const activeDecadal = useMemo(() => {
    const decadals = snapshot?.decadals ?? [];
    if (!decadals.length) return null;
    return decadals[timeline.decadalIndex] ?? findDecadalByAge(decadals, timeline.age);
  }, [snapshot?.decadals, timeline.decadalIndex, timeline.age]);

  if (!chart || !snapshot?.yearly) return null;

  const formatPalace = (index: number | null) => getPalaceLabel(chart, index);

  function focusInChart(mode: "decadal" | "small" | "yearly", palaceIndex: number | null | undefined): void {
    if (palaceIndex == null) return;
    setLayers({ decadal: true });
    selectPalace(palaceIndex, { additive: false });
    setTimeline({
      mode,
      decadalIndex: activeDecadal?.index ?? timeline.decadalIndex,
    });
  }

  return (
    <section data-surface="dark" className="rounded-xl p-3 ink-soft hud-corners">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold surface-value">运限总览（点击定位命盘）</div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-300 hud-badge" data-tone="accent">
          {timeline.year}-{String(timeline.month).padStart(2, "0")}-{String(timeline.day).padStart(2, "0")}{" "}
          {String(timeline.hour).padStart(2, "0")}:00
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 text-[12px] leading-6 surface-value">
        <button
          type="button"
          className={[
            "rounded-md border px-2 py-1.5 text-left transition-colors",
            timeline.mode === "decadal"
              ? "border-amber-700/80 bg-amber-900/25"
              : "border-slate-600/80 bg-slate-900/45 hover:bg-slate-900/70",
          ].join(" ")}
          onClick={() => focusInChart("decadal", snapshot.yearly.decadalPalaceIndex)}
        >
          大限：第 {activeDecadal ? activeDecadal.index + 1 : timeline.decadalIndex + 1} 限
          {activeDecadal ? `（${activeDecadal.startAge}-${activeDecadal.endAge} 岁）` : ""} ·{" "}
          {formatPalace(snapshot.yearly.decadalPalaceIndex)}
        </button>

        <button
          type="button"
          className={[
            "rounded-md border px-2 py-1.5 text-left transition-colors",
            timeline.mode === "small"
              ? "border-amber-700/80 bg-amber-900/25"
              : "border-slate-600/80 bg-slate-900/45 hover:bg-slate-900/70",
          ].join(" ")}
          onClick={() => focusInChart("small", snapshot.yearly.smallLimitPalaceIndex)}
        >
          小限：虚岁 {snapshot.yearly.age} · {formatPalace(snapshot.yearly.smallLimitPalaceIndex)}
        </button>

        <button
          type="button"
          className={[
            "rounded-md border px-2 py-1.5 text-left transition-colors",
            timeline.mode === "yearly"
              ? "border-sky-700/80 bg-sky-900/30"
              : "border-slate-600/80 bg-slate-900/45 hover:bg-slate-900/70",
          ].join(" ")}
          onClick={() => focusInChart("yearly", snapshot.yearly.yearlyPalaceIndex)}
        >
          流年：{snapshot.yearly.year} {snapshot.yearly.yearStem}
          {snapshot.yearly.yearBranch} · {formatPalace(snapshot.yearly.yearlyPalaceIndex)}
        </button>
      </div>

      <div className="mt-2 rounded-md px-2 py-1.5 text-[12px] leading-6 surface-value hud-scrim hud-stripe">
        流年四化：{mutagenBrief(snapshot.yearly.yearlyMutagens)}
      </div>

      {previousYearly ? (
        <div className="mt-2 rounded-md px-2 py-1.5 text-[12px] leading-6 surface-value hud-scrim">
          同比上一岁：小限 {formatPalace(previousYearly.smallLimitPalaceIndex)} →{" "}
          {formatPalace(snapshot.yearly.smallLimitPalaceIndex)}；流年 {formatPalace(previousYearly.yearlyPalaceIndex)} →{" "}
          {formatPalace(snapshot.yearly.yearlyPalaceIndex)}
        </div>
      ) : null}
    </section>
  );
}
