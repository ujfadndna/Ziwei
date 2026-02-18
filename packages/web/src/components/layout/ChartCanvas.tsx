import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

import { useChartStore } from "../../stores/chartStore";
import ChartSVG from "../chart/ChartSVG";

const MIN_CHART_ZOOM = 0.65;
const MAX_CHART_ZOOM = 2.4;
const DRAG_THRESHOLD = 3;
const ZOOM_SNAP_EPSILON = 0.012;

function clampZoom(value: number): number {
  return Math.min(MAX_CHART_ZOOM, Math.max(MIN_CHART_ZOOM, value));
}

function normalizeZoom(value: number): number {
  const clamped = clampZoom(value);
  if (Math.abs(clamped - 1) <= ZOOM_SNAP_EPSILON) return 1;
  return clamped;
}

export default function ChartCanvas() {
  const chart = useChartStore((s) => s.chart);
  const layers = useChartStore((s) => s.layers);
  const [chartZoom, setChartZoom] = useState<number>(1);
  const [chartPan, setChartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef<boolean>(false);
  const zoomPercent = useMemo(() => Math.round(chartZoom * 100), [chartZoom]);

  useEffect(() => {
    if (chartZoom > 1) return;
    if (chartPan.x === 0 && chartPan.y === 0) return;
    setChartPan({ x: 0, y: 0 });
  }, [chartPan.x, chartPan.y, chartZoom]);

  const onChartWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (!chart) return;
      event.preventDefault();
      const deltaMultiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1;
      const normalizedDelta = event.deltaY * deltaMultiplier;
      const scaleFactor = Math.exp(-normalizedDelta * 0.0012);
      setChartZoom((prev) => normalizeZoom(prev * scaleFactor));
    },
    [chart]
  );

  const resetChartZoom = useCallback(() => {
    setChartZoom(1);
    setChartPan({ x: 0, y: 0 });
  }, []);

  const onChartPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!chart || chartZoom <= 1 || event.button !== 0) return;
      suppressClickRef.current = false;
      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: chartPan.x,
        originY: chartPan.y,
        moved: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsPanning(true);
    },
    [chart, chartPan.x, chartPan.y, chartZoom]
  );

  const onChartPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD) {
      dragState.moved = true;
    }
    if (!dragState.moved) return;

    event.preventDefault();
    setChartPan({
      x: dragState.originX + deltaX,
      y: dragState.originY + deltaY,
    });
  }, []);

  const endChartPointer = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    suppressClickRef.current = dragState.moved;
    dragStateRef.current = null;
    setIsPanning(false);
  }, []);

  const onChartClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }, []);

  return (
    <main className="h-full flex-1 min-w-0 overflow-hidden p-0.5 motion-view-stage">
      <div className="flex h-full w-full min-h-0 flex-col gap-1">
        <div className="min-h-0 flex-1">
          <div className="h-full min-h-0">
            <div className="min-h-0 min-w-0 h-full rounded-xl ink-panel hud-corners flex flex-col">
              <div className="px-2.5 py-1.5 flex items-center justify-between gap-2 border-b hud-divider-subtle">
                <div className="text-sm font-semibold">命盘</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs hud-badge" data-tone="accent">
                    {layers.relations ? "关系线：开" : "关系线：关"} · {layers.mutagens ? "四化：开" : "四化：关"} · 缩放：
                    {zoomPercent}%
                  </div>
                  {chart ? (
                    <button type="button" className="hud-chip motion-chip" onClick={resetChartZoom} title="重置命盘缩放为 100%">
                      100%
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="min-h-0 flex-1 p-1">
                <div
                  className={`h-full w-full rounded-lg p-1 ink-soft hud-corners hud-crosshair hud-arc ${
                    chartZoom > 1 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
                  }`}
                  onWheel={onChartWheel}
                  onPointerDown={onChartPointerDown}
                  onPointerMove={onChartPointerMove}
                  onPointerUp={endChartPointer}
                  onPointerCancel={endChartPointer}
                  onClickCapture={onChartClickCapture}
                  onDoubleClick={resetChartZoom}
                  title={chart ? "滚轮缩放命盘（双击重置为 100%）" : undefined}
                >
                  {chart ? (
                    <ChartSVG zoom={chartZoom} panX={chartPan.x} panY={chartPan.y} isPanning={isPanning} />
                  ) : (
                    <div className="h-full w-full rounded-md border border-dashed hud-divider-subtle hud-scrim p-6 text-sm surface-help">
                      <div className="font-semibold">尚未生成命盘</div>
                      <div className="mt-2 text-xs leading-relaxed surface-help">
                        在左侧填写出生信息后点击「排盘」。支持：
                        <span className="mx-1">hover 高亮</span>
                        <span className="mx-1">click 选中</span>
                        <span className="mx-1">Shift+click 多选</span>
                        <span className="mx-1">Esc 清空选择</span>
                        <span className="mx-1">搜索星曜自动定位</span>
                        <span className="mx-1">滚轮缩放</span>
                        <span className="mx-1">左键拖拽平移</span>
                        。
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
