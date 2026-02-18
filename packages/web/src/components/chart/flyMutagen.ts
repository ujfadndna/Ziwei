import { getMutagens, type Chart, type EarthlyBranch, type MutagenType, type StarName } from "@ziwei/core";

export interface Point {
  x: number;
  y: number;
}

export interface FlyMutagenLine {
  id: string;
  fromPalaceIndex: number;
  toPalaceIndex: number;
  from: Point;
  to: Point;
  type: MutagenType;
  star: StarName;
  label: string;
}

export interface FlyMutagenState {
  lines: FlyMutagenLine[];
  inboundByPalace: Map<number, FlyMutagenLine[]>;
  oppositeWarningPalaces: Set<number>;
}

export const FLY_MUTAGEN_TYPES = ["化禄", "化权", "化科", "化忌"] as const satisfies readonly MutagenType[];
const MUTAGEN_ORDER: readonly MutagenType[] = ["化忌", "化权", "化科", "化禄"];

const MUTAGEN_SHORT: Record<MutagenType, string> = {
  化禄: "禄",
  化权: "权",
  化科: "科",
  化忌: "忌",
};

export const FLY_MUTAGEN_KEY: Record<MutagenType, string> = {
  化禄: "lu",
  化权: "quan",
  化科: "ke",
  化忌: "ji",
};

export const FLY_MUTAGEN_STYLE: Record<
  MutagenType,
  {
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
    badgeClass: string;
    fillClass: string;
    borderClass: string;
  }
> = {
  化禄: {
    stroke: "#22c55e",
    strokeWidth: 2,
    badgeClass: "border-emerald-700/70 bg-emerald-950/55 text-emerald-200",
    fillClass: "fill-emerald-950/28",
    borderClass: "stroke-emerald-500 dark:stroke-emerald-400",
  },
  化权: {
    stroke: "#f59e0b",
    strokeWidth: 3.2,
    badgeClass: "border-amber-700/80 bg-amber-950/60 text-amber-200",
    fillClass: "fill-amber-950/34",
    borderClass: "stroke-amber-500 dark:stroke-amber-400",
  },
  化科: {
    stroke: "#38bdf8",
    strokeWidth: 2.2,
    strokeDasharray: "2 4 8 4",
    badgeClass: "border-sky-700/80 bg-sky-950/60 text-sky-200",
    fillClass: "fill-sky-950/30",
    borderClass: "stroke-sky-500 dark:stroke-sky-400",
  },
  化忌: {
    stroke: "#ef4444",
    strokeWidth: 2.4,
    strokeDasharray: "8 4",
    badgeClass: "border-rose-700/85 bg-rose-950/65 text-rose-200",
    fillClass: "fill-rose-950/36",
    borderClass: "stroke-rose-500 dark:stroke-rose-400",
  },
};

export interface FlyCurveGeometry {
  from: Point;
  to: Point;
  control: Point;
  label: Point;
}

export interface FlyCurveLayoutOptions {
  center: Point;
  centerAvoidRadius: number;
  sourceInset?: number;
  targetInset?: number;
  labelT?: number;
}

function palettePriority(type: MutagenType): number {
  return MUTAGEN_ORDER.indexOf(type);
}

export function sortMutagenTypes(types: readonly MutagenType[]): MutagenType[] {
  return [...types].sort((a, b) => palettePriority(a) - palettePriority(b));
}

/**
 * 根据可见四化类型过滤飞化状态。
 */
export function filterFlyMutagenState(
  state: FlyMutagenState,
  enabledTypes: ReadonlySet<MutagenType>
): FlyMutagenState {
  if (!state.lines.length) {
    return state;
  }

  const lines = state.lines.filter((line) => enabledTypes.has(line.type));
  const inboundByPalace = new Map<number, FlyMutagenLine[]>();
  const oppositeWarningPalaces = new Set<number>();

  for (const line of lines) {
    const inbound = inboundByPalace.get(line.toPalaceIndex) ?? [];
    inboundByPalace.set(line.toPalaceIndex, [...inbound, line]);
    if (line.type === "化忌") {
      oppositeWarningPalaces.add((line.toPalaceIndex + 6) % 12);
    }
  }

  return { lines, inboundByPalace, oppositeWarningPalaces };
}

/**
 * 计算飞化线几何信息：
 * - 起止点会内缩，避免线头完全压在宫格中心
 * - 若中点靠近内盘，则自动提高弧度绕开内盘
 * - 标签靠近化入宫一侧，便于快速看“忌·天机”这类信息
 */
export function computeFlyCurveGeometry(
  line: FlyMutagenLine,
  options: FlyCurveLayoutOptions
): FlyCurveGeometry {
  const sourceInset = options.sourceInset ?? 12;
  const targetInset = options.targetInset ?? 16;
  const labelT = options.labelT ?? 0.78;

  const dx = line.to.x - line.from.x;
  const dy = line.to.y - line.from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;

  const from = {
    x: line.from.x + ux * sourceInset,
    y: line.from.y + uy * sourceInset,
  };
  const to = {
    x: line.to.x - ux * targetInset,
    y: line.to.y - uy * targetInset,
  };

  const baseCurvature =
    line.type === "化禄" ? -12 : line.type === "化权" ? -6 : line.type === "化科" ? 6 : 12;
  const mid = {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  };
  const distToCenter = Math.hypot(mid.x - options.center.x, mid.y - options.center.y);
  const centerBoost =
    distToCenter < options.centerAvoidRadius
      ? ((options.centerAvoidRadius - distToCenter) / options.centerAvoidRadius) * 72 + 28
      : 0;
  const curvature = baseCurvature + Math.sign(baseCurvature || 1) * centerBoost;

  const control = {
    x: mid.x + px * curvature,
    y: mid.y + py * curvature,
  };

  const t = Math.max(0.6, Math.min(0.86, labelT));
  const oneMinusT = 1 - t;
  const labelAnchorX = oneMinusT * oneMinusT * from.x + 2 * oneMinusT * t * control.x + t * t * to.x;
  const labelAnchorY = oneMinusT * oneMinusT * from.y + 2 * oneMinusT * t * control.y + t * t * to.y;
  const tangentX = 2 * oneMinusT * (control.x - from.x) + 2 * t * (to.x - control.x);
  const tangentY = 2 * oneMinusT * (control.y - from.y) + 2 * t * (to.y - control.y);
  const tangentLength = Math.hypot(tangentX, tangentY) || 1;
  const normalX = -tangentY / tangentLength;
  const normalY = tangentX / tangentLength;
  const labelOffset = line.type === "化权" ? 12 : line.type === "化忌" ? 11 : 10;

  const label = {
    x: labelAnchorX + normalX * labelOffset,
    y: labelAnchorY + normalY * labelOffset,
  };

  return {
    from,
    to,
    control,
    label,
  };
}

/**
 * 计算宫干四化飞化线。
 *
 * 规则：
 * - 化出宫：当前宫（宫干所在宫）
 * - 化入宫：该宫干触发的四化星所在宫
 */
export function buildFlyMutagenState(
  chart: Chart,
  selectedPalaceIndices: readonly number[],
  branchCenters: Record<EarthlyBranch, Point>
): FlyMutagenState {
  const lines: FlyMutagenLine[] = [];
  const inboundByPalace = new Map<number, FlyMutagenLine[]>();
  const oppositeWarningPalaces = new Set<number>();
  if (!selectedPalaceIndices.length) {
    return { lines, inboundByPalace, oppositeWarningPalaces };
  }

  const starPalaceMap = new Map<StarName, number>();
  const palaceByIndex = new Map<number, (typeof chart.palaces)[number]>();
  for (const palace of chart.palaces) {
    palaceByIndex.set(palace.index, palace);
    for (const star of palace.stars) {
      if (!starPalaceMap.has(star.name)) {
        starPalaceMap.set(star.name, palace.index);
      }
    }
  }

  for (const fromIndex of selectedPalaceIndices) {
    const fromPalace = palaceByIndex.get(fromIndex);
    if (!fromPalace?.stem || !fromPalace.branch) continue;
    const from = branchCenters[fromPalace.branch];
    if (!from) continue;

    const mutagens = getMutagens(fromPalace.stem);
    for (const mutagen of mutagens) {
      const toIndex = starPalaceMap.get(mutagen.star);
      if (typeof toIndex !== "number") continue;
      const toPalace = palaceByIndex.get(toIndex);
      if (!toPalace?.branch) continue;
      const to = branchCenters[toPalace.branch];
      if (!to) continue;

      const id = `fly-${fromIndex}-${toIndex}-${mutagen.type}-${mutagen.star}`;
      const line: FlyMutagenLine = {
        id,
        fromPalaceIndex: fromIndex,
        toPalaceIndex: toIndex,
        from,
        to,
        type: mutagen.type,
        star: mutagen.star,
        label: `${MUTAGEN_SHORT[mutagen.type]}·${mutagen.star}`,
      };
      lines.push(line);

      const inbound = inboundByPalace.get(toIndex) ?? [];
      inboundByPalace.set(toIndex, [...inbound, line]);

      if (mutagen.type === "化忌") {
        oppositeWarningPalaces.add((toIndex + 6) % 12);
      }
    }
  }

  return { lines, inboundByPalace, oppositeWarningPalaces };
}
