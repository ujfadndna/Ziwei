import type { BirthInfo, BirthLocation, CoinFace, CoinThreeThrow, Gender, TimeIndex, YinYang } from "@ziwei/core";
import { calculateTrueSolarTime, searchCities, type CityEntry, type TrueSolarTimeResult } from "@ziwei/core";

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

type ManualCoinLine = [CoinFace, CoinFace, CoinFace];
type ManualCastLabel = "老阴" | "少阳" | "少阴" | "老阳";

interface ManualCastPreview {
  sum: 6 | 7 | 8 | 9;
  label: ManualCastLabel;
  yinYang: YinYang;
  moving: boolean;
}

const LINE_NAMES = ["初", "二", "三", "四", "五", "上"] as const;
const COIN_SCORE: Record<CoinFace, 2 | 3> = {
  heads: 3,
  tails: 2,
};

function createDefaultManualLines(): ManualCoinLine[] {
  return Array.from({ length: 6 }, () => ["heads", "tails", "tails"] as ManualCoinLine);
}

function toggleCoinFace(face: CoinFace): CoinFace {
  return face === "heads" ? "tails" : "heads";
}

function castPreviewFromLine(line: ManualCoinLine): ManualCastPreview {
  const sum = line.reduce((acc, face) => acc + COIN_SCORE[face], 0);
  if (sum === 6) {
    return { sum: 6, label: "老阴", yinYang: "阴", moving: true };
  }
  if (sum === 7) {
    return { sum: 7, label: "少阳", yinYang: "阳", moving: false };
  }
  if (sum === 8) {
    return { sum: 8, label: "少阴", yinYang: "阴", moving: false };
  }
  return { sum: 9, label: "老阳", yinYang: "阳", moving: true };
}

function yaoSymbol(yinYang: YinYang): string {
  return yinYang === "阳" ? "─────" : "── ──";
}

function coinFaceText(face: CoinFace): string {
  return face === "heads" ? "正(3)" : "反(2)";
}

export default function BirthForm() {
  const buildFromBirth = useChartStore((s) => s.buildFromBirth);
  const isBuilding = useChartStore((s) => s.isBuilding);
  const appMode = useChartStore((s) => s.appMode);
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
    if (typeof lastBirth?.civilTimeIndex === "number") return lastBirth.civilTimeIndex;
    if (typeof lastBirth?.timeIndex === "number") return lastBirth.timeIndex;
    if (!lastBirth?.datetime) return 4;
    const d = new Date(lastBirth.datetime);
    if (Number.isNaN(d.getTime())) return 4;
    return timeIndexFromHour(d.getHours());
  });
  const [manualCastingEnabled, setManualCastingEnabled] = useState<boolean>(false);
  const [manualLineThrows, setManualLineThrows] = useState<ManualCoinLine[]>(() => createDefaultManualLines());
  const [cityQuery, setCityQuery] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<CityEntry | null>(null);
  const [useTrueSolarTime, setUseTrueSolarTime] = useState<boolean>(false);

  useEffect(() => {
    if (!lastBirth?.datetime) return;
    const d = new Date(lastBirth.datetime);
    if (Number.isNaN(d.getTime())) return;

    setGender(lastBirth.gender);
    setDate(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
    setTimeIndex(lastBirth.civilTimeIndex ?? lastBirth.timeIndex);

    if (lastBirth?.location?.name) {
      const matches = searchCities(lastBirth.location.name, 1);
      if (matches.length > 0) {
        const firstMatch = matches[0];
        if (firstMatch) {
          setSelectedCity(firstMatch);
          setCityQuery(firstMatch.name);
          // Do NOT auto-enable - let user manually check the box
          setUseTrueSolarTime(false);
        }
      } else {
        setSelectedCity(null);
        setCityQuery(lastBirth.location.name);
        setUseTrueSolarTime(false);
      }
    } else {
      setSelectedCity(null);
      setCityQuery("");
      setUseTrueSolarTime(false);
    }
  }, [lastBirth]);

  const datetimeValue = useMemo(() => {
    if (!date) return "";
    // UI仅保留“时辰”，这里用时辰起始时刻组装datetime。
    const hour = hourFromTimeIndex(timeIndex);
    return `${date}T${pad2(hour)}:00:00`;
  }, [date, timeIndex]);

  const cityResults = useMemo(() => {
    if (!cityQuery.trim()) return [];
    return searchCities(cityQuery.trim(), 10);
  }, [cityQuery]);

  const trueSolarResult = useMemo<TrueSolarTimeResult | null>(() => {
    if (!useTrueSolarTime || !selectedCity || !datetimeValue) return null;
    return calculateTrueSolarTime(datetimeValue, timeIndex, selectedCity.longitude);
  }, [useTrueSolarTime, selectedCity, datetimeValue, timeIndex]);

  const manualPreviews = useMemo(() => {
    return manualLineThrows.map((line) => castPreviewFromLine(line));
  }, [manualLineThrows]);

  const manualCoinThrows = useMemo(() => {
    return manualLineThrows.map((line) => [line[0], line[1], line[2]] as CoinThreeThrow);
  }, [manualLineThrows]);

  function onToggleManualCoin(lineIdx: number, coinIdx: number): void {
    setManualLineThrows((prev) =>
      prev.map((line, idx) => {
        if (idx !== lineIdx) return line;
        const next: ManualCoinLine = [...line] as ManualCoinLine;
        const current = next[coinIdx] ?? "heads";
        next[coinIdx] = toggleCoinFace(current);
        return next;
      }),
    );
  }

  function onResetManualCoins(): void {
    setManualLineThrows(createDefaultManualLines());
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!datetimeValue) return;

    const location: BirthLocation | undefined = selectedCity
      ? {
          name: selectedCity.name,
          latitude: selectedCity.latitude,
          longitude: selectedCity.longitude,
          timeZone: "Asia/Shanghai",
        }
      : undefined;

    const birth: BirthInfo = {
      gender,
      datetime: trueSolarResult?.adjustedDatetime ?? datetimeValue,
      timeIndex: trueSolarResult?.adjustedTimeIndex ?? timeIndex,
      civilTimeIndex: trueSolarResult ? timeIndex : undefined,
    };
    if (location) {
      birth.location = location;
    }

    const liuyaoOptions =
      appMode === "liuyao" && manualCastingEnabled ? { liuyaoLineThrows: manualCoinThrows } : undefined;
    buildFromBirth(birth, liuyaoOptions);
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

      {appMode === "liuyao" ? (
        <section className="space-y-2 rounded-md p-2 ink-soft hud-corners">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide surface-label">六爻起卦</div>
            <span className="hud-badge" data-tone={manualCastingEnabled ? "accent" : undefined}>
              {manualCastingEnabled ? "手动投币模式" : "自动投币模式"}
            </span>
          </div>

          <label className="flex items-center justify-between gap-2 rounded-md border border-slate-600/70 bg-slate-950/55 px-2 py-2 text-sm">
            <div className="flex flex-col">
              <span className="surface-value">手动投币 6 爻</span>
              <span className="text-[11px] surface-help">自下而上：初爻 → 上爻（每爻 3 枚）</span>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 dark:border-slate-500"
              checked={manualCastingEnabled}
              onChange={(e) => setManualCastingEnabled(e.target.checked)}
            />
          </label>

          {manualCastingEnabled ? (
            <div className="space-y-1.5 rounded-md border border-slate-600/70 bg-slate-950/55 p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] surface-help">点按硬币切换正/反，先读卦象，再看动静与世应。</div>
                <button
                  type="button"
                  className="hud-chip motion-chip"
                  onClick={onResetManualCoins}
                >
                  重置
                </button>
              </div>

              {manualLineThrows.map((line, lineIdx) => {
                const preview = manualPreviews[lineIdx];
                if (!preview) return null;
                return (
                  <div key={`manual-line-${lineIdx + 1}`} className="rounded-md border border-slate-600/70 bg-slate-950/60 px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs surface-value">
                        第{lineIdx + 1}爻（{LINE_NAMES[lineIdx]}爻）
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="liuyao-line-glyph text-sm" data-yinyang={preview.yinYang}>
                          {yaoSymbol(preview.yinYang)}
                        </span>
                        <span className="hud-badge" data-tone={preview.moving ? "risk" : undefined}>
                          {preview.label}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {line.map((face, coinIdx) => (
                        <button
                          key={`manual-line-${lineIdx + 1}-coin-${coinIdx + 1}`}
                          type="button"
                          className="liuyao-coin-toggle"
                          data-face={face}
                          onClick={() => onToggleManualCoin(lineIdx, coinIdx)}
                          aria-label={`第${lineIdx + 1}爻第${coinIdx + 1}枚硬币，当前${coinFaceText(face)}`}
                        >
                          {coinFaceText(face)}
                        </button>
                      ))}
                      <div className="ml-auto text-[11px] surface-help">合计：{preview.sum}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[11px] surface-help">
              未启用手动投币时，将按出生信息使用可复现的确定性投掷序列（trace 可追溯）。
            </div>
          )}
        </section>
      ) : null}

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

          <label className="block">
            <div className="text-[11px] surface-label">出生城市</div>
            <div className="relative mt-1">
              <input
                type="text"
                className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100"
                placeholder="输入城市名搜索..."
                value={cityQuery}
                onChange={(e) => {
                  setCityQuery(e.target.value);
                  if (!e.target.value.trim()) {
                    setSelectedCity(null);
                    setUseTrueSolarTime(false);
                  }
                }}
              />
              {cityResults.length > 0 && !selectedCity && (
                <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-zinc-200 bg-white text-sm shadow-lg dark:border-slate-500 dark:bg-slate-900">
                  {cityResults.map((city) => (
                    <li key={`${city.province}-${city.name}`}>
                      <button
                        type="button"
                        className="w-full px-2 py-1 text-left hover:bg-zinc-100 dark:hover:bg-slate-800"
                        onClick={() => {
                          setSelectedCity(city);
                          setCityQuery(city.name);
                        }}
                      >
                        {city.name} ({city.province}) {city.longitude.toFixed(1)}°E
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedCity && (
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="surface-help">
                  {selectedCity.name} ({selectedCity.province}) {selectedCity.longitude.toFixed(2)}°E
                </span>
                <button
                  type="button"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => {
                    setSelectedCity(null);
                    setCityQuery("");
                    setUseTrueSolarTime(false);
                  }}
                >
                  清除
                </button>
              </div>
            )}
          </label>

          <label className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-slate-500 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-sm">使用真太阳时</span>
              <span className="text-[11px] surface-help">根据出生城市经度修正北京时间</span>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 dark:border-slate-500"
              checked={useTrueSolarTime}
              onChange={(e) => setUseTrueSolarTime(e.target.checked)}
              disabled={!selectedCity}
            />
          </label>

          {trueSolarResult && (
            <div className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[11px] dark:border-slate-500 dark:bg-slate-900">
              <div className="surface-help">
                修正: {trueSolarResult.totalAdjustmentMinutes >= 0 ? "+" : ""}
                {trueSolarResult.totalAdjustmentMinutes.toFixed(1)} 分钟（经度{" "}
                {trueSolarResult.breakdown.longitudeCorrectionMinutes >= 0 ? "+" : ""}
                {trueSolarResult.breakdown.longitudeCorrectionMinutes.toFixed(1)}, 时差方程{" "}
                {trueSolarResult.breakdown.equationOfTimeMinutes >= 0 ? "+" : ""}
                {trueSolarResult.breakdown.equationOfTimeMinutes.toFixed(1)}）
              </div>
              {trueSolarResult.timeIndexChanged && (
                <div className="mt-0.5 font-semibold text-amber-400">
                  时辰变化: {TIME_INDEX_OPTIONS[trueSolarResult.breakdown.originalTimeIndex]?.label} →{" "}
                  {TIME_INDEX_OPTIONS[trueSolarResult.adjustedTimeIndex]?.label}
                </div>
              )}
            </div>
          )}

          <div className="text-[11px] surface-help">
            datetime(由时辰生成): <span className="font-mono">{datetimeValue || "-"}</span>
          </div>
        </div>
      </details>

      <button
        type="submit"
        className="hud-primary-button"
        disabled={isBuilding || !datetimeValue}
      >
        {isBuilding ? "排盘中…" : "排盘"}
      </button>
    </form>
  );
}
