import { useCallback, useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";

import { useChartStore } from "../../stores/chartStore";
import { usePersistentNumber } from "../../utils/usePersistentNumber";
import AppErrorBoundary from "../common/AppErrorBoundary";
import BaziCanvas from "./BaziCanvas";
import ChartCanvas from "./ChartCanvas";
import QimenCanvas from "./QimenCanvas";
import ControlPanel from "./ControlPanel";
import Inspector from "./Inspector";
import Timeline from "../timeline/Timeline";

const DARK_MODE_KEY = "ziwei:web:dark-v2";
const LEFT_PANEL_SIZE_KEY = "ziwei:web:layout:left-width-v3";
const INSPECTOR_SIZE_KEY = "ziwei:web:layout:inspector-width";

export default function AppLayout() {
  const chart = useChartStore((s) => s.chart);
  const baziChart = useChartStore((s) => s.baziChart);
  const qimenChart = useChartStore((s) => s.qimenChart);
  const isBuilding = useChartStore((s) => s.isBuilding);
  const buildError = useChartStore((s) => s.buildError);
  const ruleSetId = useChartStore((s) => s.ruleSetId);
  const selection = useChartStore((s) => s.selection);
  const clearSelection = useChartStore((s) => s.clearSelection);
  const chartLayout = useChartStore((s) => s.chartLayout);
  const setChartLayout = useChartStore((s) => s.setChartLayout);
  const appMode = useChartStore((s) => s.appMode);
  const setAppMode = useChartStore((s) => s.setAppMode);
  const themePreference = useChartStore((s) => s.themePreference);
  const resolvedTheme = useChartStore((s) => s.resolvedTheme);
  const setTheme = useChartStore((s) => s.setTheme);
  const resetThemePreference = useChartStore((s) => s.resetThemePreference);
  const [showInspector, setShowInspector] = useState<boolean>(false);
  const [leftPanelWidth, setLeftPanelWidth] = usePersistentNumber({
    storageKey: LEFT_PANEL_SIZE_KEY,
    initial: 230,
    min: 170,
    max: 380,
  });
  const [inspectorWidth, setInspectorWidth] = usePersistentNumber({
    storageKey: INSPECTOR_SIZE_KEY,
    initial: 280,
    min: 220,
    max: 480,
  });

  useEffect(() => {
    document.documentElement.classList.add("dark");
    window.localStorage.setItem(DARK_MODE_KEY, "1");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        clearSelection();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearSelection]);

  const selectionSummary = useMemo(() => {
    const palaceCount = selection.selectedPalaces.length;
    const starCount = selection.selectedStars.length;
    if (palaceCount === 0 && starCount === 0) return "未选择";
    if (palaceCount > 0 && starCount === 0) return `已选宫位 ${palaceCount} 个`;
    if (palaceCount === 0 && starCount > 0) return `已选星曜 ${starCount} 个`;
    return `已选宫位 ${palaceCount} 个 / 星曜 ${starCount} 个`;
  }, [selection.selectedPalaces.length, selection.selectedStars.length]);

  const modeSummary = useMemo(() => {
    if (appMode === "bazi") {
      return baziChart ? "八字已生成" : "尚未生成八字";
    }
    if (appMode === "qimen") {
      return qimenChart ? "奇门盘已生成" : "尚未生成奇门盘";
    }
    return selectionSummary;
  }, [appMode, baziChart, qimenChart, selectionSummary]);

  const startHorizontalResize = useCallback(
    (
      event: ReactPointerEvent<HTMLDivElement>,
      startSize: number,
      setSize: (value: number) => void,
      direction: 1 | -1
    ) => {
      event.preventDefault();
      const startX = event.clientX;
      const move = (moveEvent: PointerEvent) => {
        const delta = (moveEvent.clientX - startX) * direction;
        setSize(startSize + delta);
      };
      const stop = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop);
    },
    []
  );

  const onLeftPanelResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      startHorizontalResize(event, leftPanelWidth, setLeftPanelWidth, 1);
    },
    [leftPanelWidth, setLeftPanelWidth, startHorizontalResize]
  );

  const onInspectorResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      startHorizontalResize(event, inspectorWidth, setInspectorWidth, -1);
    },
    [inspectorWidth, setInspectorWidth, startHorizontalResize]
  );

  return (
    <div data-theme={resolvedTheme} data-surface="dark" className="theme-root h-full flex flex-col">
      <header className="shrink-0 border-b hud-divider-subtle hud-panel">
        <div className="px-4 py-2 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <div className="shrink-0 font-semibold tracking-tight">Ziwei Web</div>
            <div className="min-w-0 text-xs surface-help">
              <span className="truncate">
                {appMode === "ziwei" ? `规则集：${ruleSetId}` : appMode === "bazi" ? "系统：八字排盘" : "系统：奇门遁甲"}
              </span>
              <span className="mx-2 surface-divider">·</span>
              <span>{modeSummary}</span>
              {isBuilding ? (
                <>
                  <span className="mx-2 surface-divider">·</span>
                  <span className="hud-badge" data-tone="accent">排盘中…</span>
                </>
              ) : null}
              {buildError ? (
                <>
                  <span className="mx-2 surface-divider">·</span>
                  <span className="hud-badge" data-tone="risk">错误：{buildError}</span>
                </>
              ) : null}
              {!chart ? (
                <>
                  <span className="mx-2 surface-divider">·</span>
                  <span className="surface-help">尚未生成命盘</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <div className="rounded-md p-0.5 ink-soft motion-tab-group">
              <button
                type="button"
                className={["hud-chip motion-chip", appMode === "ziwei" ? "is-active" : ""].join(" ")}
                onClick={() => setAppMode("ziwei")}
                title="紫微斗数命盘视图"
              >
                紫微
              </button>
              <button
                type="button"
                className={["hud-chip motion-chip", appMode === "bazi" ? "is-active" : ""].join(" ")}
                onClick={() => setAppMode("bazi")}
                title="八字排盘视图"
              >
                八字
              </button>
              <button
                type="button"
                className={["hud-chip motion-chip", appMode === "qimen" ? "is-active" : ""].join(" ")}
                onClick={() => setAppMode("qimen")}
                title="奇门遁甲排盘视图"
              >
                奇门
              </button>
            </div>
            <div className="rounded-md p-0.5 ink-soft motion-tab-group" aria-label="主题切换">
              <button
                type="button"
                className={["hud-chip motion-chip", resolvedTheme === "ziwei" && themePreference !== "auto" ? "is-active" : ""].join(" ")}
                onClick={() => setTheme("ziwei")}
                title="切换到紫微主题"
              >
                紫微色
              </button>
              <button
                type="button"
                className={["hud-chip motion-chip", resolvedTheme === "bazi" && themePreference !== "auto" ? "is-active" : ""].join(" ")}
                onClick={() => setTheme("bazi")}
                title="切换到八字主题"
              >
                八字色
              </button>
              <button
                type="button"
                className={["hud-chip motion-chip", resolvedTheme === "qimen" && themePreference !== "auto" ? "is-active" : ""].join(" ")}
                onClick={() => setTheme("qimen")}
                title="切换到奇门主题"
              >
                奇门色
              </button>
              <button
                type="button"
                className={["hud-chip motion-chip", themePreference === "auto" ? "is-active" : ""].join(" ")}
                onClick={() => resetThemePreference()}
                title="按系统自动选择主题：紫微/八字/奇门"
              >
                自动
              </button>
            </div>
            {appMode === "ziwei" ? (
              <div className="rounded-md p-0.5 ink-soft motion-tab-group">
                <button
                  type="button"
                  className={["hud-chip motion-chip", chartLayout === "wenmo" ? "is-active" : ""].join(" ")}
                  onClick={() => setChartLayout("wenmo")}
                  title="文墨布局（传统宫格）"
                >
                  文墨盘
                </button>
                <button
                  type="button"
                  className={["hud-chip motion-chip", chartLayout === "round" ? "is-active" : ""].join(" ")}
                  onClick={() => setChartLayout("round")}
                  title="圆盘布局（12宫环形）"
                >
                  圆盘
                </button>
              </div>
            ) : null}
            {appMode === "ziwei" ? (
              <button
                type="button"
                className={["hud-chip motion-chip", showInspector ? "is-active" : ""].join(" ")}
                onClick={() => setShowInspector((v) => !v)}
                title="切换右侧详情面板（搜索/详情/日志）"
              >
                {showInspector ? "隐藏详情" : "显示详情"}
              </button>
            ) : null}
            {appMode === "ziwei" ? (
              <button type="button" className="hud-chip motion-chip" onClick={() => clearSelection()} title="清空选中（Esc）">
                清空选择
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <AppErrorBoundary scope="ControlPanel">
          <ControlPanel width={leftPanelWidth} onResizeStart={onLeftPanelResizeStart} />
        </AppErrorBoundary>
        <div className="flex-1 min-w-0 h-full motion-view-stage">
          <AppErrorBoundary scope={appMode === "ziwei" ? "ChartCanvas" : appMode === "bazi" ? "BaziCanvas" : "QimenCanvas"}>
            {appMode === "ziwei" ? <ChartCanvas /> : appMode === "bazi" ? <BaziCanvas /> : <QimenCanvas />}
          </AppErrorBoundary>
        </div>
        {showInspector && appMode === "ziwei" ? (
          <AppErrorBoundary scope="Inspector">
            <Inspector width={inspectorWidth} onResizeStart={onInspectorResizeStart} />
          </AppErrorBoundary>
        ) : null}
      </div>

      {appMode === "ziwei" ? (
        <AppErrorBoundary scope="Timeline">
          <Timeline />
        </AppErrorBoundary>
      ) : null}
    </div>
  );
}
