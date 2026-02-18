import { useMemo } from "react";

import { useChartStore } from "../../stores/chartStore";
import ChartSVGRound from "./ChartSVGRound";
import ChartSVGWenmo from "./ChartSVGWenmo";

interface ChartSVGProps {
  zoom?: number;
  panX?: number;
  panY?: number;
  isPanning?: boolean;
}

const BASE_PAN_LIMIT = 280;
const DEFAULT_VIEWPORT_EPSILON = 0.0001;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function ChartSVG(props: ChartSVGProps) {
  const { zoom = 1, panX = 0, panY = 0, isPanning = false } = props;
  const chartLayout = useChartStore((s) => s.chartLayout);

  const maxPan = useMemo(() => {
    if (zoom <= 1) return 0;
    return (zoom - 1) * BASE_PAN_LIMIT;
  }, [zoom]);

  const clampedPanX = clamp(panX, -maxPan, maxPan);
  const clampedPanY = clamp(panY, -maxPan, maxPan);
  const isDefaultViewport =
    Math.abs(zoom - 1) <= DEFAULT_VIEWPORT_EPSILON &&
    Math.abs(clampedPanX) <= DEFAULT_VIEWPORT_EPSILON &&
    Math.abs(clampedPanY) <= DEFAULT_VIEWPORT_EPSILON;

  return (
    <div className="h-full w-full overflow-hidden">
      <div
        className="h-full w-full"
        style={{
          transform: isDefaultViewport ? "none" : `translate3d(${clampedPanX}px, ${clampedPanY}px, 0) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isPanning || isDefaultViewport ? "none" : "transform var(--motion-hover) var(--motion-ease)",
          willChange: isDefaultViewport ? "auto" : "transform",
        }}
      >
        {chartLayout === "round" ? <ChartSVGRound /> : <ChartSVGWenmo />}
      </div>
    </div>
  );
}
