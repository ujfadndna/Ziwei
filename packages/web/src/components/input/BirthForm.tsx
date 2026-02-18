import type { BirthInfo, Gender, TimeIndex } from "@ziwei/core";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { useChartStore } from "../../stores/chartStore";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function timeIndexFromHour(hour: number): TimeIndex {
  // Rough mapping (2-hour blocks, 子时包含 23:00-00:59).
  if (hour === 23 || hour === 0) return 0;
  if (hour === 1 || hour === 2) return 1;
  if (hour === 3 || hour === 4) return 2;
  if (hour === 5 || hour === 6) return 3;
  if (hour === 7 || hour === 8) return 4;
  if (hour === 9 || hour === 10) return 5;
  if (hour === 11 || hour === 12) return 6;
  if (hour === 13 || hour === 14) return 7;
  if (hour === 15 || hour === 16) return 8;
  if (hour === 17 || hour === 18) return 9;
  if (hour === 19 || hour === 20) return 10;
  return 11;
}

function hourFromTimeIndex(timeIndex: TimeIndex): number {
  switch (timeIndex) {
    case 0:
      return 23;
    case 1:
      return 1;
    case 2:
      return 3;
    case 3:
      return 5;
    case 4:
      return 7;
    case 5:
      return 9;
    case 6:
      return 11;
    case 7:
      return 13;
    case 8:
      return 15;
    case 9:
      return 17;
    case 10:
      return 19;
    case 11:
      return 21;
    default:
      return 12;
  }
}

const TIME_INDEX_OPTIONS: Array<{ value: TimeIndex; label: string }> = [
  { value: 0, label: "子 (23-00)" },
  { value: 1, label: "丑 (01-02)" },
  { value: 2, label: "寅 (03-04)" },
  { value: 3, label: "卯 (05-06)" },
  { value: 4, label: "辰 (07-08)" },
  { value: 5, label: "巳 (09-10)" },
  { value: 6, label: "午 (11-12)" },
  { value: 7, label: "未 (13-14)" },
  { value: 8, label: "申 (15-16)" },
  { value: 9, label: "酉 (17-18)" },
  { value: 10, label: "戌 (19-20)" },
  { value: 11, label: "亥 (21-22)" },
  { value: 12, label: "不详" },
];

export default function BirthForm() {
  const buildFromBirth = useChartStore((s) => s.buildFromBirth);
  const isBuilding = useChartStore((s) => s.isBuilding);
  const enableTrace = useChartStore((s) => s.enableTrace);
  const setEnableTrace = useChartStore((s) => s.setEnableTrace);
  const lastBirth = useChartStore((s) => s.lastBirth);

  const [gender, setGender] = useState<Gender>(() => lastBirth?.gender ?? "男");
  const [date, setDate] = useState<string>(() => {
    if (!lastBirth?.datetime) return todayLocal();
    const d = new Date(lastBirth.datetime);
    if (Number.isNaN(d.getTime())) return todayLocal();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  });
  const [timeIndex, setTimeIndex] = useState<TimeIndex>(() => {
    if (typeof lastBirth?.timeIndex === "number") return lastBirth.timeIndex;
    if (!lastBirth?.datetime) return 4;
    const d = new Date(lastBirth.datetime);
    if (Number.isNaN(d.getTime())) return 4;
    return timeIndexFromHour(d.getHours());
  });

  useEffect(() => {
    if (!lastBirth?.datetime) return;
    const d = new Date(lastBirth.datetime);
    if (Number.isNaN(d.getTime())) return;

    setGender(lastBirth.gender);
    setDate(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
    setTimeIndex(lastBirth.timeIndex);
  }, [lastBirth]);

  const datetimeValue = useMemo(() => {
    if (!date) return "";
    // UI仅保留“时辰”，这里用时辰起始时刻组装datetime。
    const hour = hourFromTimeIndex(timeIndex);
    return `${date}T${pad2(hour)}:00:00`;
  }, [date, timeIndex]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!datetimeValue) return;

    const birth: BirthInfo = {
      gender,
      datetime: datetimeValue,
      timeIndex,
    };

    buildFromBirth(birth);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <section className="space-y-2 rounded-md p-2 ink-soft hud-corners">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">首屏必填</div>
          <div className="text-[11px] surface-help">先填这里即可排盘</div>
        </div>

        <label className="block">
          <div className="text-[11px] surface-label">性别</div>
          <select
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
          >
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </label>

        <label className="block">
          <div className="text-[11px] surface-label">日期（公历）</div>
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <div className="text-[11px] surface-label">时辰</div>
          <select
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100"
            value={String(timeIndex)}
            onChange={(e) => {
              setTimeIndex(Number(e.target.value) as TimeIndex);
            }}
          >
            {TIME_INDEX_OPTIONS.map((opt) => (
              <option key={opt.value} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

      </section>

      <details className="rounded-md p-2 ink-soft hud-corners">
        <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wide surface-label">
          二级抽屉 · 高级参数
        </summary>
        <div className="mt-2 space-y-2">
          <label className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-slate-500 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-sm">推导日志</span>
              <span className="text-[11px] surface-help">用于展示 buildChart 过程（调试/解释）</span>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 dark:border-slate-500"
              checked={enableTrace}
              onChange={(e) => setEnableTrace(e.target.checked)}
            />
          </label>

          <div className="text-[11px] surface-help">
            datetime(由时辰生成): <span className="font-mono">{datetimeValue || "-"}</span>
          </div>
        </div>
      </details>

      <button
        type="submit"
        className="w-full rounded-md bg-sky-600 px-2 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-800 disabled:text-slate-100"
        disabled={isBuilding || !datetimeValue}
      >
        {isBuilding ? "排盘中…" : "排盘"}
      </button>
    </form>
  );
}
