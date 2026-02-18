import { useCallback, useMemo } from "react";

import { useChartStore } from "../../stores/chartStore";
import { buildCycleSnapshot, buildCycleYearRow, clampSolarDay, getDaysInSolarMonth } from "../../utils/cycleTimeline";

interface DecadalYearlyQuickTableProps {
  className?: string;
}

const COLUMN_COUNT = 9;

const MONTH_LABELS = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"] as const;

const HOUR_SEQUENCE = [
  { label: "子时", hour: 0 },
  { label: "丑时", hour: 1 },
  { label: "寅时", hour: 3 },
  { label: "卯时", hour: 5 },
  { label: "辰时", hour: 7 },
  { label: "巳时", hour: 9 },
  { label: "午时", hour: 11 },
  { label: "未时", hour: 13 },
  { label: "申时", hour: 15 },
  { label: "酉时", hour: 17 },
  { label: "戌时", hour: 19 },
  { label: "亥时", hour: 21 },
] as const;

function toChineseDay(day: number): string {
  const map: Record<number, string> = {
    1: "初一",
    2: "初二",
    3: "初三",
    4: "初四",
    5: "初五",
    6: "初六",
    7: "初七",
    8: "初八",
    9: "初九",
    10: "初十",
    11: "十一",
    12: "十二",
    13: "十三",
    14: "十四",
    15: "十五",
    16: "十六",
    17: "十七",
    18: "十八",
    19: "十九",
    20: "二十",
    21: "廿一",
    22: "廿二",
    23: "廿三",
    24: "廿四",
    25: "廿五",
    26: "廿六",
    27: "廿七",
    28: "廿八",
    29: "廿九",
    30: "三十",
    31: "卅一",
  };
  return map[day] ?? `${day}日`;
}

function findHourStartIndex(hour: number): number {
  let matched = 0;
  for (let i = 0; i < HOUR_SEQUENCE.length; i += 1) {
    if (hour >= HOUR_SEQUENCE[i].hour) {
      matched = i;
    }
  }
  return matched;
}

export default function DecadalYearlyQuickTable(props: DecadalYearlyQuickTableProps) {
  const { className } = props;
  const chart = useChartStore((s) => s.chart);
  const timeline = useChartStore((s) => s.timeline);
  const setTimeline = useChartStore((s) => s.setTimeline);
  const setLayers = useChartStore((s) => s.setLayers);
  const selectPalace = useChartStore((s) => s.selectPalace);

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

  const maxSupportedAge =
    snapshot && snapshot.decadals.length > 0 ? snapshot.decadals[snapshot.decadals.length - 1].endAge : timeline.age;

  const buildRowByAge = useCallback((age: number): ReturnType<typeof buildCycleYearRow> => {
    if (!chart || !snapshot) return null;
    try {
      return buildCycleYearRow(chart, snapshot.decadals, age, {
        month: timeline.month,
        day: timeline.day,
        hour: timeline.hour,
        preset: snapshot.preset,
      });
    } catch {
      return null;
    }
  }, [chart, snapshot, timeline.day, timeline.hour, timeline.month]);

  const yearColumns = useMemo(() => {
    if (!chart || !snapshot) return [];
    const result: Array<NonNullable<ReturnType<typeof buildCycleYearRow>>> = [];
    for (let offset = 0; offset < COLUMN_COUNT; offset += 1) {
      const targetAge = Math.max(1, timeline.age + offset);
      if (targetAge > maxSupportedAge) break;
      const row = buildRowByAge(targetAge);
      if (!row) continue;
      result.push(row);
    }
    return result;
  }, [buildRowByAge, chart, maxSupportedAge, snapshot, timeline.age]);

  const decadalColumns = useMemo(() => {
    if (!chart || !snapshot) return [];

    const ages: number[] = [];
    const firstDecadal = snapshot.decadals[0] ?? null;

    if (!firstDecadal) {
      ages.push(Math.max(1, timeline.age));
    } else if (timeline.age < firstDecadal.startAge) {
      // 起运前只保留一格，后续按 10 年一格推进。
      ages.push(1);
      for (let offset = 0; offset < COLUMN_COUNT - 1; offset += 1) {
        ages.push(firstDecadal.startAge + offset * 10);
      }
    } else {
      const activeDecadalIndex = snapshot.decadals.findIndex((item) => timeline.age >= item.startAge && timeline.age <= item.endAge);
      const startDecadalIndex = activeDecadalIndex >= 0 ? activeDecadalIndex : 0;
      for (let offset = 0; offset < COLUMN_COUNT; offset += 1) {
        const item = snapshot.decadals[startDecadalIndex + offset];
        if (!item) break;
        ages.push(item.startAge);
      }
    }

    const result: Array<NonNullable<ReturnType<typeof buildCycleYearRow>>> = [];
    for (const age of ages) {
      if (age > maxSupportedAge) break;
      const row = buildRowByAge(age);
      if (!row) continue;
      result.push(row);
    }
    return result;
  }, [buildRowByAge, chart, maxSupportedAge, snapshot, timeline.age]);

  const monthColumns = useMemo(
    () =>
      Array.from({ length: COLUMN_COUNT }, (_, offset) => {
        const value = ((timeline.month - 1 + offset) % 12) + 1;
        return {
          value,
          label: MONTH_LABELS[value - 1],
        };
      }),
    [timeline.month]
  );

  const dayColumns = useMemo(() => {
    const dayCount = getDaysInSolarMonth(timeline.year, timeline.month);
    return Array.from({ length: COLUMN_COUNT }, (_, offset) => {
      const value = ((timeline.day - 1 + offset) % dayCount) + 1;
      return {
        value,
        label: toChineseDay(value),
      };
    });
  }, [timeline.year, timeline.month, timeline.day]);

  const hourColumns = useMemo(() => {
    const start = findHourStartIndex(timeline.hour);
    return Array.from({ length: COLUMN_COUNT }, (_, offset) => {
      return HOUR_SEQUENCE[(start + offset) % HOUR_SEQUENCE.length];
    });
  }, [timeline.hour]);

  function focusYear(row: (typeof yearColumns)[number] | null | undefined): void {
    if (!row) return;
    const day = clampSolarDay(row.year, timeline.month, timeline.day);
    setTimeline({
      mode: "yearly",
      age: row.age,
      year: row.year,
      day,
      decadalIndex: row.decadalIndex ?? timeline.decadalIndex,
    });
    if (row.yearlyPalaceIndex != null) {
      setLayers({ decadal: true });
      selectPalace(row.yearlyPalaceIndex, { additive: false });
    }
  }

  function focusDecadal(row: (typeof yearColumns)[number] | null | undefined): void {
    if (!row) return;
    setTimeline({
      mode: "decadal",
      age: row.age,
      year: row.year,
      decadalIndex: row.decadalIndex ?? timeline.decadalIndex,
    });
    if (row.decadalPalaceIndex != null) {
      setLayers({ decadal: true });
      selectPalace(row.decadalPalaceIndex, { additive: false });
    }
  }

  function focusMonth(month: number): void {
    const day = clampSolarDay(timeline.year, month, timeline.day);
    setTimeline({ mode: "monthly", month, day });
  }

  function focusDay(day: number): void {
    setTimeline({
      mode: "daily",
      day: clampSolarDay(timeline.year, timeline.month, day),
    });
  }

  function focusHour(hour: number): void {
    setTimeline({ mode: "hourly", hour });
  }

  const timelineRows = useMemo(() => {
    const rowCount = Math.max(decadalColumns.length, yearColumns.length, monthColumns.length, dayColumns.length, hourColumns.length);
    return Array.from({ length: rowCount }, (_, index) => ({
      decadal: decadalColumns[index] ?? null,
      yearly: yearColumns[index] ?? null,
      monthly: monthColumns[index] ?? null,
      daily: dayColumns[index] ?? null,
      hourly: hourColumns[index] ?? null,
    }));
  }, [decadalColumns, yearColumns, monthColumns, dayColumns, hourColumns]);

  if (!chart || !snapshot || yearColumns.length === 0 || timelineRows.length === 0) return null;

  const firstDecadal = snapshot.decadals[0] ?? null;
  const activeDecadalIndex = snapshot.decadals.findIndex((item) => timeline.age >= item.startAge && timeline.age <= item.endAge);

  const prevDecadalColumn = (() => {
    if (!firstDecadal) return null;
    if (timeline.age < firstDecadal.startAge) return null;
    if (activeDecadalIndex > 0) {
      return buildRowByAge(snapshot.decadals[activeDecadalIndex - 1].startAge);
    }
    if (firstDecadal.startAge > 1) {
      return buildRowByAge(1);
    }
    return null;
  })();

  const nextDecadalColumn = (() => {
    if (activeDecadalIndex < 0) {
      if (!firstDecadal) return null;
      return buildRowByAge(firstDecadal.startAge);
    }
    const next = snapshot.decadals[activeDecadalIndex + 1];
    if (!next) return null;
    return buildRowByAge(next.startAge);
  })();

  return (
    <section data-surface="dark" className={`rounded-xl p-2 ink-soft hud-corners min-h-0 overflow-auto ${className ?? ""}`.trim()}>
      <div className="grid min-w-[900px] grid-cols-[minmax(170px,1.2fr)_minmax(190px,1.35fr)_repeat(3,minmax(120px,1fr))] text-center">
        <div className="border border-slate-600/80 bg-slate-900/72 px-1 py-1">
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:text-slate-500 disabled:hover:bg-transparent"
              onClick={() => focusDecadal(prevDecadalColumn)}
              disabled={!prevDecadalColumn}
            >
              ◁
            </button>
            <div className="text-[24px] font-bold leading-none text-slate-100">大限</div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:text-slate-500 disabled:hover:bg-transparent"
              onClick={() => focusDecadal(nextDecadalColumn)}
              disabled={!nextDecadalColumn}
            >
              ▷
            </button>
          </div>
        </div>
        <div className="border border-slate-600/80 bg-slate-900/72 px-2 py-1 text-[24px] font-bold leading-none text-slate-100">流年 / 小限</div>
        <div className="border border-slate-600/80 bg-slate-900/72 px-2 py-1 text-[24px] font-bold leading-none text-slate-100">流月</div>
        <div className="border border-slate-600/80 bg-slate-900/72 px-2 py-1 text-[24px] font-bold leading-none text-slate-100">流日</div>
        <div className="border border-slate-600/80 bg-slate-900/72 px-2 py-1 text-[24px] font-bold leading-none text-slate-100">流时</div>

        {timelineRows.map((row, rowIndex) => {
          const stripeClass = rowIndex % 2 === 0 ? "bg-slate-900/44" : "bg-slate-900/34";

          const decadal = row.decadal && row.decadal.decadalIndex != null ? snapshot.decadals[row.decadal.decadalIndex] ?? null : null;
          const decadalActive = row.decadal ? timeline.mode === "decadal" && row.decadal.age === timeline.age : false;
          const yearlyActive = row.yearly ? timeline.mode === "yearly" && row.yearly.age === timeline.age : false;
          const monthlyActive = row.monthly ? timeline.mode === "monthly" && timeline.month === row.monthly.value : false;
          const dailyActive = row.daily ? timeline.mode === "daily" && timeline.day === row.daily.value : false;
          const hourlyActive = row.hourly ? timeline.mode === "hourly" && timeline.hour === row.hourly.hour : false;

          return (
            <div key={`timeline-row-${rowIndex}`} className="contents">
              <div className={`border border-slate-700/80 px-1 py-1 ${stripeClass}`}>
                {row.decadal ? (
                  <button
                    type="button"
                    onClick={() => focusDecadal(row.decadal)}
                    className={[
                      "h-full w-full rounded-md px-1 py-1 transition-colors hover:bg-slate-800/70",
                      decadalActive ? "bg-sky-900/45 ring-1 ring-sky-400/70" : "",
                    ].join(" ")}
                  >
                    {decadal ? (
                      <>
                        <div className="text-[12px] font-semibold text-slate-100">
                          {decadal.startAge}~{decadal.endAge}
                        </div>
                        <div className="mt-0.5 text-[12px] font-semibold text-slate-300">
                          {row.decadal.yearStem}
                          {row.decadal.yearBranch}限
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[12px] font-semibold text-slate-100">起限前</div>
                        <div className="mt-0.5 text-[12px] font-semibold text-slate-300">(童限)</div>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="px-1 py-2 text-[11px] font-semibold text-slate-500">—</div>
                )}
              </div>

              <div className={`border border-slate-700/80 px-1 py-1 ${stripeClass}`}>
                {row.yearly ? (
                  <button
                    type="button"
                    onClick={() => focusYear(row.yearly)}
                    className={[
                      "h-full w-full rounded-md px-1 py-1 transition-colors hover:bg-slate-800/70",
                      yearlyActive ? "bg-sky-900/45 ring-1 ring-sky-400/70" : "",
                    ].join(" ")}
                  >
                    <div className="text-[12px] font-semibold text-slate-100">{row.yearly.year}年</div>
                    <div className="mt-0.5 text-[12px] font-semibold text-slate-300">
                      {row.yearly.yearStem}
                      {row.yearly.yearBranch}
                      {row.yearly.age}岁
                    </div>
                  </button>
                ) : (
                  <div className="px-1 py-2 text-[11px] font-semibold text-slate-500">—</div>
                )}
              </div>

              <div className={`border border-slate-700/80 px-1 py-1 ${stripeClass}`}>
                {row.monthly ? (
                  <button
                    type="button"
                    onClick={() => focusMonth(row.monthly.value)}
                    className={[
                      "h-full w-full rounded-md px-1 py-2 text-[12px] font-semibold text-slate-300 transition-colors hover:bg-slate-800/70",
                      monthlyActive ? "bg-sky-900/45 text-slate-100 ring-1 ring-sky-400/70" : "",
                    ].join(" ")}
                  >
                    {row.monthly.label}
                  </button>
                ) : (
                  <div className="px-1 py-2 text-[11px] font-semibold text-slate-500">—</div>
                )}
              </div>

              <div className={`border border-slate-700/80 px-1 py-1 ${stripeClass}`}>
                {row.daily ? (
                  <button
                    type="button"
                    onClick={() => focusDay(row.daily.value)}
                    className={[
                      "h-full w-full rounded-md px-1 py-2 text-[12px] font-semibold text-slate-300 transition-colors hover:bg-slate-800/70",
                      dailyActive ? "bg-sky-900/45 text-slate-100 ring-1 ring-sky-400/70" : "",
                    ].join(" ")}
                  >
                    {row.daily.label}
                  </button>
                ) : (
                  <div className="px-1 py-2 text-[11px] font-semibold text-slate-500">—</div>
                )}
              </div>

              <div className={`border border-slate-700/80 px-1 py-1 ${stripeClass}`}>
                {row.hourly ? (
                  <button
                    type="button"
                    onClick={() => focusHour(row.hourly.hour)}
                    className={[
                      "h-full w-full rounded-md px-1 py-2 text-[12px] font-semibold text-slate-300 transition-colors hover:bg-slate-800/70",
                      hourlyActive ? "bg-sky-900/45 text-slate-100 ring-1 ring-sky-400/70" : "",
                    ].join(" ")}
                  >
                    {row.hourly.label}
                  </button>
                ) : (
                  <div className="px-1 py-2 text-[11px] font-semibold text-slate-500">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
