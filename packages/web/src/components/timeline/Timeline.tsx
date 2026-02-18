import { useCallback, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";

import { useChartStore } from "../../stores/chartStore";
import { usePersistentNumber } from "../../utils/usePersistentNumber";
import {
  buildCycleRowsInAgeRange,
  buildCycleSnapshot,
  clampSolarDay,
  findDecadalByAge,
  getDaysInSolarMonth,
  getPalaceLabel,
  getVirtualAgeByYear,
  getYearByVirtualAge,
} from "../../utils/cycleTimeline";

function mutagenText(stem: string, mutagens: Array<{ type: string; star: string }>): string {
  return `${stem}干：${mutagens.map((item) => `${item.type}${item.star}`).join("、")}`;
}

function format2(value: number): string {
  return String(value).padStart(2, "0");
}

const TIMELINE_PANEL_HEIGHT_KEY = "ziwei:web:timeline:panel-height";

export default function Timeline() {
  const chart = useChartStore((s) => s.chart);
  const timeline = useChartStore((s) => s.timeline);
  const setTimeline = useChartStore((s) => s.setTimeline);
  const viewMode = useChartStore((s) => s.viewMode);
  const setViewMode = useChartStore((s) => s.setViewMode);
  const compare = useChartStore((s) => s.compare);
  const setCompare = useChartStore((s) => s.setCompare);

  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [panelHeight, setPanelHeight] = usePersistentNumber({
    storageKey: TIMELINE_PANEL_HEIGHT_KEY,
    initial: 360,
    min: 220,
    max: 620,
  });

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

  const activeDecadal = useMemo(() => {
    const decadals = snapshot?.decadals ?? [];
    if (!decadals.length) return null;
    return decadals[timeline.decadalIndex] ?? findDecadalByAge(decadals, timeline.age);
  }, [snapshot?.decadals, timeline.decadalIndex, timeline.age]);

  const rowsInCurrentDecadal = useMemo(() => {
    if (!chart || !snapshot || !activeDecadal) return [];
    const fromAge = activeDecadal.index === 0 ? 1 : activeDecadal.startAge;
    return buildCycleRowsInAgeRange(chart, snapshot.decadals, fromAge, activeDecadal.endAge, {
      preset: snapshot.preset,
    });
  }, [chart, snapshot, activeDecadal]);

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

  const presetLabel = snapshot ? `${snapshot.preset.label} · 小限(${snapshot.preset.smallLimitMethod === "ming-palace" ? "命宫起限" : "年支起限"}) · 流月(${snapshot.preset.monthlyMethod === "lunar-month" ? "农历月" : "节气月"})` : "—";

  const formatPalace = (index: number | null) => getPalaceLabel(chart, index);

  function setYearAndSyncAge(year: number): void {
    if (!Number.isFinite(year)) return;
    const normalizedYear = Math.floor(year);
    const nextDay = clampSolarDay(normalizedYear, timeline.month, timeline.day);

    if (!chart) {
      setTimeline({ year: normalizedYear, day: nextDay });
      return;
    }

    const age = getVirtualAgeByYear(chart.date.solar.year, normalizedYear);
    const matchedDecadal = findDecadalByAge(snapshot?.decadals ?? [], age);
    setTimeline({
      year: normalizedYear,
      age,
      day: nextDay,
      decadalIndex: matchedDecadal?.index ?? timeline.decadalIndex,
    });
  }

  function setAgeAndSyncYear(age: number): void {
    if (!Number.isFinite(age)) return;
    const normalizedAge = Math.max(1, Math.floor(age));

    if (!chart) {
      setTimeline({ age: normalizedAge });
      return;
    }

    const year = getYearByVirtualAge(chart.date.solar.year, normalizedAge);
    const matchedDecadal = findDecadalByAge(snapshot?.decadals ?? [], normalizedAge);
    const day = clampSolarDay(year, timeline.month, timeline.day);
    setTimeline({
      age: normalizedAge,
      year,
      day,
      decadalIndex: matchedDecadal?.index ?? timeline.decadalIndex,
    });
  }

  function setMonthAndClampDay(month: number): void {
    if (!Number.isFinite(month)) return;
    const normalizedMonth = Math.min(12, Math.max(1, Math.floor(month)));
    const day = clampSolarDay(timeline.year, normalizedMonth, timeline.day);
    setTimeline({ month: normalizedMonth, day });
  }

  function setDayInMonth(day: number): void {
    if (!Number.isFinite(day)) return;
    const normalizedDay = clampSolarDay(timeline.year, timeline.month, day);
    setTimeline({ day: normalizedDay });
  }

  function setHourInDay(hour: number): void {
    if (!Number.isFinite(hour)) return;
    const normalizedHour = Math.min(23, Math.max(0, Math.floor(hour)));
    setTimeline({ hour: normalizedHour });
  }

  function jumpToDecadal(index: number): void {
    const target = snapshot?.decadals[index];
    if (!target || !chart) {
      setTimeline({ decadalIndex: index });
      return;
    }
    setTimeline({
      decadalIndex: index,
      mode: "decadal",
      age: target.startAge,
      year: getYearByVirtualAge(chart.date.solar.year, target.startAge),
    });
  }

  const decadalLabel = activeDecadal
    ? `大限(${activeDecadal.startAge}-${activeDecadal.endAge})`
    : `大限(${timeline.decadalIndex + 1}/12)`;
  const smallLabel = `小限(虚岁${timeline.age})`;
  const yearlyLabel = snapshot?.yearly
    ? `流年(${snapshot.yearly.year} ${snapshot.yearly.yearStem}${snapshot.yearly.yearBranch})`
    : `流年(${timeline.year})`;
  const monthlyLabel = snapshot?.monthly
    ? `流月(${snapshot.monthly.monthStem}${snapshot.monthly.monthBranch})`
    : `流月(${timeline.month}月)`;
  const dailyLabel = snapshot?.daily
    ? `流日(${snapshot.daily.dayStem}${snapshot.daily.dayBranch})`
    : `流日(${format2(timeline.day)}日)`;
  const hourlyLabel = snapshot?.hourly
    ? `流时(${snapshot.hourly.hourStem}${snapshot.hourly.hourBranch})`
    : `流时(${format2(timeline.hour)}时)`;

  const onPanelResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = panelHeight;
      const move = (moveEvent: PointerEvent) => {
        const delta = startY - moveEvent.clientY;
        setPanelHeight(startHeight + delta);
      };
      const stop = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop);
    },
    [panelHeight, setPanelHeight]
  );

  return (
    <footer data-surface="dark" className="shrink-0 border-t border-zinc-200/70 dark:border-slate-700/70 hud-panel">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-xs text-zinc-600 dark:text-slate-200">
            <span className={timeline.mode === "natal" ? "font-semibold text-zinc-900 dark:text-zinc-100" : ""}>本命</span>
            <span className="mx-2 text-zinc-300 dark:text-zinc-700">──</span>
            <span className={timeline.mode === "decadal" ? "font-semibold text-zinc-900 dark:text-zinc-100" : ""}>
              {decadalLabel}
            </span>
            <span className="mx-2 text-zinc-300 dark:text-zinc-700">──</span>
            <span className={timeline.mode === "small" ? "font-semibold text-zinc-900 dark:text-zinc-100" : ""}>{smallLabel}</span>
            <span className="mx-2 text-zinc-300 dark:text-zinc-700">──</span>
            <span className={timeline.mode === "yearly" ? "font-semibold text-zinc-900 dark:text-zinc-100" : ""}>
              {yearlyLabel}
            </span>
            <span className="mx-2 text-zinc-300 dark:text-zinc-700">──</span>
            <span className={timeline.mode === "monthly" ? "font-semibold text-zinc-900 dark:text-zinc-100" : ""}>
              {monthlyLabel}
            </span>
            <span className="mx-2 text-zinc-300 dark:text-zinc-700">──</span>
            <span className={timeline.mode === "daily" ? "font-semibold text-zinc-900 dark:text-zinc-100" : ""}>
              {dailyLabel}
            </span>
            <span className="mx-2 text-zinc-300 dark:text-zinc-700">──</span>
            <span className={timeline.mode === "hourly" ? "font-semibold text-zinc-900 dark:text-zinc-100" : ""}>
              {hourlyLabel}
            </span>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {collapsed ? (
              <div className="text-[11px] surface-help">
                点击展开可查看大限 / 小限 / 流年 / 流月 / 流日 / 流时及变化
              </div>
            ) : null}
            <button
              type="button"
              className="hud-chip"
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? "展开运限" : "折叠运限"}
            </button>
          </div>
        </div>

        {!collapsed ? (
          <div className="mt-3 rounded-md p-2 ink-soft hud-corners">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-[11px] surface-help">运限明细已展开</div>
              <div className="text-[11px] surface-help">拖动分隔条可调高度</div>
            </div>
            <div
              role="separator"
              aria-orientation="horizontal"
              aria-label="调整运限面板高度"
              title="拖动调整运限面板高度"
              className="hud-resize-handle mb-2"
              data-axis="y"
              data-side="start"
              onPointerDown={onPanelResizeStart}
            />
            <div className="space-y-3 overflow-auto pr-1" style={{ height: `${panelHeight}px` }}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">Mode</div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "natal", label: "本命" },
                      { id: "decadal", label: "大限" },
                      { id: "small", label: "小限" },
                      { id: "yearly", label: "流年" },
                      { id: "monthly", label: "流月" },
                      { id: "daily", label: "流日" },
                      { id: "hourly", label: "流时" },
                    ] as const
                  ).map((item) => {
                    const active = timeline.mode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={[
                          "hud-chip",
                          active
                            ? "is-active"
                            : "",
                        ].join(" ")}
                        onClick={() => setTimeline({ mode: item.id })}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <div className="text-[11px] surface-label">虚岁</div>
                    <input
                      type="number"
                      min={1}
                      className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                      value={timeline.age}
                      onChange={(event) => setAgeAndSyncYear(Number(event.target.value))}
                    />
                  </label>
                  <label className="block">
                    <div className="text-[11px] surface-label">年份</div>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                      value={timeline.year}
                      onChange={(event) => setYearAndSyncAge(Number(event.target.value))}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <label className="block">
                    <div className="text-[11px] surface-label">月</div>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                      value={timeline.month}
                      onChange={(event) => setMonthAndClampDay(Number(event.target.value))}
                    />
                  </label>
                  <label className="block">
                    <div className="text-[11px] surface-label">日</div>
                    <input
                      type="number"
                      min={1}
                      max={getDaysInSolarMonth(timeline.year, timeline.month)}
                      className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                      value={timeline.day}
                      onChange={(event) => setDayInMonth(Number(event.target.value))}
                    />
                  </label>
                  <label className="block">
                    <div className="text-[11px] surface-label">时</div>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                      value={timeline.hour}
                      onChange={(event) => setHourInDay(Number(event.target.value))}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">View</div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "overlay", label: "Overlay" },
                      { id: "replace", label: "Replace" },
                      { id: "diff", label: "Diff" },
                    ] as const
                  ).map((item) => {
                    const active = viewMode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={[
                          "hud-chip",
                          active
                            ? "is-active"
                            : "",
                        ].join(" ")}
                        onClick={() => setViewMode(item.id)}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] surface-help">
                  已支持：按年龄/日期连续观察大限、小限、流年、流月、流日、流时变化。
                </div>
                <div className="text-[11px] surface-help">当前运限算法：{presetLabel}</div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">Compare</div>
                <label className="flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm ink-soft">
                  <div className="flex flex-col">
                    <span>规则集对比</span>
                    <span className="text-[11px] surface-help">左/右规则集并排或 diff（预留）</span>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
                    checked={compare.enabled}
                    onChange={(event) => setCompare({ enabled: event.target.checked })}
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <div className="text-[11px] surface-label">Left</div>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                      value={compare.leftRuleSet}
                      onChange={(event) => setCompare({ leftRuleSet: event.target.value })}
                      disabled={!compare.enabled}
                    />
                  </label>
                  <label className="block">
                    <div className="text-[11px] surface-label">Right</div>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                      value={compare.rightRuleSet}
                      onChange={(event) => setCompare({ rightRuleSet: event.target.value })}
                      disabled={!compare.enabled}
                    />
                  </label>
                </div>
              </div>
            </div>

              {snapshot?.decadals.length ? (
                <div className="rounded-md p-2 ink-soft hud-corners">
                  <div className="mb-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">大限总览（点击跳转）</div>
                  <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-3">
                    {snapshot.decadals.map((item) => {
                      const active = item.index === activeDecadal?.index;
                      return (
                        <button
                          key={item.index}
                          type="button"
                          className={[
                            "hud-chip justify-start text-left text-[11px]",
                            active
                              ? "is-active"
                              : "",
                          ].join(" ")}
                          onClick={() => jumpToDecadal(item.index)}
                        >
                          第{item.index + 1}限 · {item.startAge}-{item.endAge}岁 · {formatPalace(item.palaceIndex)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {snapshot?.yearly ? (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="rounded-md p-2 ink-soft hud-corners">
                    <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      当前变化（{timeline.year}-{format2(timeline.month)}-{format2(timeline.day)} {format2(timeline.hour)}:00）
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                      <div>大限落宫：{formatPalace(snapshot.yearly.decadalPalaceIndex)}</div>
                      <div>小限落宫：{formatPalace(snapshot.yearly.smallLimitPalaceIndex)}</div>
                      <div>
                        流年落宫：{formatPalace(snapshot.yearly.yearlyPalaceIndex)} · {snapshot.yearly.yearStem}
                        {snapshot.yearly.yearBranch}
                      </div>
                      {snapshot.monthly ? (
                        <div>
                          流月落宫：{formatPalace(snapshot.monthly.monthlyPalaceIndex)} · {snapshot.monthly.monthStem}
                          {snapshot.monthly.monthBranch}
                        </div>
                      ) : null}
                      {snapshot.daily ? (
                        <div>
                          流日落宫：{formatPalace(snapshot.daily.dailyPalaceIndex)} · {snapshot.daily.dayStem}
                          {snapshot.daily.dayBranch}
                        </div>
                      ) : null}
                      {snapshot.hourly ? (
                        <div>
                          流时落宫：{formatPalace(snapshot.hourly.hourlyPalaceIndex)} · {snapshot.hourly.hourStem}
                          {snapshot.hourly.hourBranch}
                        </div>
                      ) : null}
                      <div>流年四化：{mutagenText(snapshot.yearly.yearStem, snapshot.yearly.yearlyMutagens)}</div>
                      {snapshot.monthly ? <div>流月四化：{mutagenText(snapshot.monthly.monthStem, snapshot.monthly.monthlyMutagens)}</div> : null}
                      {snapshot.daily ? <div>流日四化：{mutagenText(snapshot.daily.dayStem, snapshot.daily.dailyMutagens)}</div> : null}
                      {snapshot.hourly ? <div>流时四化：{mutagenText(snapshot.hourly.hourStem, snapshot.hourly.hourlyMutagens)}</div> : null}
                    </div>

                    {previousYearly ? (
                      <div className="mt-2 rounded-md p-2 text-[11px] text-zinc-600 dark:text-zinc-300 ink-soft hud-stripe">
                        <div>相较上一岁（虚岁 {previousYearly.age}）</div>
                        <div>
                          小限：{formatPalace(previousYearly.smallLimitPalaceIndex)} → {formatPalace(snapshot.yearly.smallLimitPalaceIndex)}
                        </div>
                        <div>
                          流年：{formatPalace(previousYearly.yearlyPalaceIndex)} → {formatPalace(snapshot.yearly.yearlyPalaceIndex)}
                        </div>
                        <div>
                          四化：{mutagenText(previousYearly.yearStem, previousYearly.yearlyMutagens)} →{" "}
                          {mutagenText(snapshot.yearly.yearStem, snapshot.yearly.yearlyMutagens)}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-md p-2 ink-soft hud-corners">
                    <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      当前大限逐年表（{activeDecadal?.startAge ?? "?"}-{activeDecadal?.endAge ?? "?"}岁）
                    </div>
                    <div className="mt-2 max-h-52 overflow-auto">
                      <table className="w-full border-collapse text-[11px]">
                        <thead>
                          <tr className="text-zinc-500 dark:text-zinc-400">
                            <th className="py-1 text-left font-medium">虚岁</th>
                            <th className="py-1 text-left font-medium">年份</th>
                            <th className="py-1 text-left font-medium">小限</th>
                            <th className="py-1 text-left font-medium">流年</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rowsInCurrentDecadal.map((row) => (
                            <tr
                              key={row.age}
                              className={[
                                "border-t border-zinc-100 dark:border-zinc-900",
                                row.age === timeline.age ? "bg-sky-50/80 dark:bg-[#1c2f45]/70" : "",
                              ].join(" ")}
                            >
                              <td className="py-1">{row.age}</td>
                              <td className="py-1">
                                <button
                                  type="button"
                                  className="text-left text-sky-700 hover:underline dark:text-sky-300"
                                  onClick={() => setAgeAndSyncYear(row.age)}
                                >
                                  {row.year}
                                </button>
                              </td>
                              <td className="py-1">{formatPalace(row.smallLimitPalaceIndex)}</td>
                              <td className="py-1">{formatPalace(row.yearlyPalaceIndex)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </footer>
  );
}
