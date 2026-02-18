import type { MutagenType, Palace, Star } from "@ziwei/core";

import { memo, useMemo } from "react";

import { useChartStore } from "../../stores/chartStore";
import { FLY_MUTAGEN_STYLE, sortMutagenTypes } from "./flyMutagen";
import { isShaStarName } from "./StarBadge";

export interface PalaceCellProps {
  palace: Palace;
  x: number;
  y: number;
  size: number;
  stars: readonly Star[];
  isMing: boolean;
  isBody: boolean;
  isOrigin: boolean;
  isRelationFocus: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isSearchHit: boolean;
  hasSelectedStar: boolean;
  searchHitStarName: string | null;
  cycleMarkers: ReadonlyArray<{ id: string; label: string }>;
  currentFlowStars: ReadonlyArray<string>;
  flyInMutagens: ReadonlyArray<{ type: MutagenType; star: string }>;
  yearlyAges: ReadonlyArray<number>;
  smallLimitAges: ReadonlyArray<number>;
  decadalRange: { startAge: number; endAge: number } | null;
  isOppositeWarning: boolean;
  isCycleChanged: boolean;
}

const CHANGSHENG_STAR_SET = new Set<string>([
  "长生",
  "沐浴",
  "冠带",
  "临官",
  "帝旺",
  "衰",
  "病",
  "死",
  "墓",
  "绝",
  "胎",
  "养",
]);

function toneClassOfStar(star: Star): string {
  if (star.type === "major") return "text-rose-300";
  if (isShaStarName(star.name)) return "text-sky-300";
  if (star.type === "minor") return "text-violet-300";
  return "text-cyan-200";
}

function flyInToneClass(type: MutagenType): string {
  if (type === "化禄") return "bg-emerald-950/45 text-emerald-200 ring-1 ring-emerald-500/65";
  if (type === "化权") return "bg-amber-950/52 text-amber-200 ring-1 ring-amber-500/75";
  if (type === "化科") return "bg-sky-950/52 text-sky-200 ring-1 ring-sky-500/75";
  return "bg-rose-950/56 text-rose-200 ring-1 ring-rose-500/80";
}

function splitStarName(name: string): { top: string; bottom: string } {
  const chars = Array.from(name);
  if (chars.length === 0) return { top: "", bottom: "" };
  if (chars.length === 1) return { top: chars[0] ?? "", bottom: "" };
  return { top: chars[0] ?? "", bottom: chars[1] ?? "" };
}

function pickBrightnessGlyph(brightness?: string): string {
  if (!brightness) return "·";
  return Array.from(brightness)[0] ?? "·";
}

function PalaceCellComponent(props: PalaceCellProps) {
  const {
    palace,
    x,
    y,
    size,
    stars,
    isMing,
    isBody,
    isOrigin,
    isRelationFocus,
    isSelected,
    isHovered,
    isSearchHit,
    hasSelectedStar,
    searchHitStarName,
    cycleMarkers,
    currentFlowStars,
    flyInMutagens,
    decadalRange,
    isOppositeWarning,
    isCycleChanged,
  } = props;

  const layers = useChartStore((s) => s.layers);
  const compactMode = useChartStore((s) => s.compactMode);
  const selection = useChartStore((s) => s.selection);
  const selectPalace = useChartStore((s) => s.selectPalace);
  const selectStar = useChartStore((s) => s.selectStar);
  const setHoveredPalace = useChartStore((s) => s.setHoveredPalace);
  const setHoveredStar = useChartStore((s) => s.setHoveredStar);

  const visibleStars = useMemo(() => {
    // Use abbreviated two-row rendering to keep all stars legible in compact cells.
    const baseMax = size <= 100 ? 8 : size <= 112 ? 9 : 10;
    const max = compactMode ? Math.max(6, baseMax - 2) : baseMax;
    const trimmed = stars.slice(0, max);
    const rest = stars.length - trimmed.length;
    return { trimmed, rest };
  }, [compactMode, size, stars]);

  const flyInTypes = useMemo(() => {
    const unique = new Set<MutagenType>(flyInMutagens.map((item) => item.type));
    return sortMutagenTypes(Array.from(unique));
  }, [flyInMutagens]);

  const highestFlyType = flyInTypes[0] ?? null;
  const longevityStarName = stars.find((star) => CHANGSHENG_STAR_SET.has(star.name))?.name ?? null;
  const stemBranchText = `${palace.stem ?? ""}${palace.branch ?? ""}` || palace.branch || "?";
  const palaceLabel = palace.name.endsWith("宫") ? palace.name.slice(0, -1) : palace.name;

  const strokeClass = (() => {
    if (isSelected) return "stroke-sky-500 dark:stroke-sky-400";
    if (hasSelectedStar) return "stroke-amber-400 dark:stroke-amber-400";
    if (isHovered) return "stroke-sky-400 dark:stroke-sky-500";
    if (isSearchHit) return "stroke-sky-300 dark:stroke-sky-700";
    if (isRelationFocus) return "stroke-cyan-500 dark:stroke-cyan-400";
    if (isOrigin) return "stroke-cyan-400 dark:stroke-cyan-300";
    if (isOppositeWarning) return "stroke-rose-500 dark:stroke-rose-400";
    if (highestFlyType) return FLY_MUTAGEN_STYLE[highestFlyType].borderClass;
    return "stroke-zinc-300 dark:stroke-slate-600";
  })();

  const fillClass = (() => {
    if (isSelected) return "fill-slate-900";
    if (isHovered) return "fill-slate-800";
    if (isSearchHit) return "fill-slate-800/90";
    if (highestFlyType) return FLY_MUTAGEN_STYLE[highestFlyType].fillClass;
    if (isRelationFocus) return "fill-cyan-950/24";
    if (isCycleChanged) return "fill-amber-950/32";
    if (cycleMarkers.length > 0) return "fill-amber-950/26";
    return "fill-slate-900/94";
  })();

  const starItems = visibleStars.trimmed.map((star) => ({
    star,
    toneClass: toneClassOfStar(star),
    glyph: splitStarName(star.name),
  }));
  const brightnessGlyphs = visibleStars.trimmed.map((star) => pickBrightnessGlyph(star.brightness));
  const mutagenRows = layers.mutagens
    ? starItems.filter((item) => item.star.mutagen).map((item) => ({ starName: item.star.name, mutagen: item.star.mutagen! }))
    : [];
  const flyInTypeByStar = useMemo(() => {
    if (!layers.mutagens || flyInMutagens.length === 0) return new Map<string, MutagenType>();
    const grouped = new Map<string, MutagenType[]>();
    for (const item of flyInMutagens) {
      const current = grouped.get(item.star) ?? [];
      if (!current.includes(item.type)) {
        grouped.set(item.star, [...current, item.type]);
      }
    }

    const result = new Map<string, MutagenType>();
    for (const [starName, types] of grouped) {
      const prioritized = sortMutagenTypes(types)[0];
      if (prioritized) result.set(starName, prioritized);
    }
    return result;
  }, [layers.mutagens, flyInMutagens]);
  const flowVisibleLimit = size <= 100 ? 2 : 3;
  const flowStars = currentFlowStars.slice(0, flowVisibleLimit);

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer palace-cell"
      data-selected={isSelected ? "1" : undefined}
      data-hovered={isHovered ? "1" : undefined}
      onMouseEnter={() => setHoveredPalace(palace.index)}
      onMouseLeave={() => {
        setHoveredPalace(null);
        setHoveredStar(null);
      }}
      onClick={(e) => selectPalace(palace.index, { additive: e.shiftKey })}
      role="group"
      aria-label={`${palace.branch ?? ""}${palace.name}`}
    >
      <rect x={1} y={1} width={size - 2} height={size - 2} rx={10} className={`${fillClass} ${strokeClass}`} strokeWidth={2} />

      {isOppositeWarning ? (
        <rect
          x={4}
          y={4}
          width={size - 8}
          height={size - 8}
          rx={8}
          fill="none"
          className="stroke-rose-400/85"
          strokeWidth={1.4}
          strokeDasharray="4 3"
        />
      ) : null}

      <foreignObject x={4} y={4} width={size - 8} height={size - 8}>
        <div className="h-full w-full p-1">
          <div className="h-full w-full flex gap-1">
            <div className="min-w-0 flex-1 flex flex-col">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-semibold tracking-wide text-slate-300">{palace.branch ?? "?"}</span>
                <div className="flex items-center gap-0.5 text-[8px] leading-3">
                  {cycleMarkers.map((marker) => (
                    <span key={marker.id} className="rounded border border-amber-700/70 px-1 text-amber-200">
                      {marker.label}
                    </span>
                  ))}
                  {isMing ? <span className="rounded border border-emerald-700/70 px-1 text-emerald-200">命</span> : null}
                  {isBody ? <span className="rounded border border-violet-700/70 px-1 text-violet-200">身</span> : null}
                  {isOrigin ? <span className="rounded border border-cyan-700/70 px-1 text-cyan-200">来</span> : null}
                  {visibleStars.rest > 0 ? <span className="rounded border border-slate-500/70 px-1 text-slate-200">+{visibleStars.rest}</span> : null}
                </div>
              </div>

              <div className="mt-0.5 flex items-start gap-[1px]">
                {starItems.length > 0 ? (
                  starItems.map((item) => {
                    const isStarSelected = selection.selectedStars.includes(item.star.name);
                    const isStarHovered = selection.hoveredStar === item.star.name;
                    const isStarSearchHit = searchHitStarName === item.star.name;
                    const active = isStarSelected || isStarHovered || isStarSearchHit;
                    const flyInType = flyInTypeByStar.get(item.star.name) ?? null;
                    const passiveStateClass = flyInType ? flyInToneClass(flyInType) : "hover:bg-slate-800/70";

                    return (
                      <button
                        key={`${palace.index}-${item.star.name}`}
                        type="button"
                        className={`inline-flex min-w-[7px] flex-col items-center rounded-[2px] px-0 py-[1px] text-[9px] font-semibold leading-[8px] transition-colors ${item.toneClass} ${
                          active ? "bg-slate-700/70 ring-1 ring-sky-400/75 text-slate-100" : passiveStateClass
                        }`}
                        onMouseEnter={() => setHoveredStar(item.star.name, { palaceIndex: palace.index })}
                        onMouseLeave={() => setHoveredStar(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectStar(item.star.name, { additive: e.shiftKey, palaceIndex: palace.index });
                        }}
                        title={flyInType ? `${item.star.name} · ${flyInType}飞入` : item.star.name}
                      >
                        <span>{item.glyph.top}</span>
                        <span>{item.glyph.bottom || "\u00A0"}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-[10px] text-slate-400">无星曜</div>
                )}
              </div>

              <div className="mt-0.5 flex items-center gap-[1px] text-[8px] leading-[8px] text-slate-200">
                {brightnessGlyphs.map((glyph, index) => (
                  <span key={`${palace.index}-bright-${index}`} className="inline-flex min-w-[7px] justify-center">
                    {glyph}
                  </span>
                ))}
              </div>

              {mutagenRows.length > 0 ? (
                <div className="mt-0.5 flex items-center gap-0.5 text-[8px] leading-3">
                  {mutagenRows.slice(0, 4).map(({ starName, mutagen }) => (
                    <span
                      key={`${palace.index}-${starName}-${mutagen.type}`}
                      className={`rounded px-1 font-semibold ${
                        mutagen.type === "化禄"
                          ? "bg-emerald-700 text-white"
                          : mutagen.type === "化权"
                            ? "bg-amber-700 text-white"
                            : mutagen.type === "化科"
                              ? "bg-sky-700 text-white"
                              : "bg-rose-700 text-white"
                      }`}
                      title={`${mutagen.type}·${starName}`}
                    >
                      {mutagen.type.replace("化", "")}
                    </span>
                  ))}
                  {mutagenRows.length > 4 ? <span className="text-slate-300">+{mutagenRows.length - 4}</span> : null}
                </div>
              ) : (
                <div className="h-3" />
              )}

              <div className="mt-0.5 h-6" />

              <div className="mt-auto flex items-end justify-between gap-1">
                <div className="min-w-[16px] text-[8px] leading-3 text-cyan-200">
                  {flowStars.map((star) => (
                    <div key={`${palace.index}-flow-${star}`}>{star}</div>
                  ))}
                  {currentFlowStars.length > flowVisibleLimit ? <div>+{currentFlowStars.length - flowVisibleLimit}</div> : null}
                </div>

                <div className="min-w-0 flex-1 text-center">
                  {decadalRange ? (
                    <div className="text-[11px] font-semibold italic text-rose-300">
                      {decadalRange.startAge}~{decadalRange.endAge}
                    </div>
                  ) : null}
                  <div className="truncate text-[14px] font-bold tracking-wide text-rose-300" title={palaceLabel}>
                    {palaceLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-3 shrink-0 flex flex-col items-center justify-between">
              {longevityStarName ? (
                <div style={{ writingMode: "vertical-rl" }} className="text-[9px] font-semibold leading-none text-zinc-300">
                  {longevityStarName}
                </div>
              ) : (
                <span />
              )}
              <div style={{ writingMode: "vertical-rl" }} className="text-[10px] font-semibold leading-none text-slate-100">
                {stemBranchText}
              </div>
            </div>
          </div>
        </div>
      </foreignObject>
    </g>
  );
}

function areDecadalRangeEqual(
  prev: PalaceCellProps["decadalRange"],
  next: PalaceCellProps["decadalRange"]
): boolean {
  if (prev === next) return true;
  if (!prev || !next) return false;
  return prev.startAge === next.startAge && prev.endAge === next.endAge;
}

function arePalaceCellPropsEqual(prev: PalaceCellProps, next: PalaceCellProps): boolean {
  return (
    prev.palace === next.palace &&
    prev.x === next.x &&
    prev.y === next.y &&
    prev.size === next.size &&
    prev.stars === next.stars &&
    prev.isMing === next.isMing &&
    prev.isBody === next.isBody &&
    prev.isOrigin === next.isOrigin &&
    prev.isRelationFocus === next.isRelationFocus &&
    prev.isSelected === next.isSelected &&
    prev.isHovered === next.isHovered &&
    prev.isSearchHit === next.isSearchHit &&
    prev.hasSelectedStar === next.hasSelectedStar &&
    prev.searchHitStarName === next.searchHitStarName &&
    prev.cycleMarkers === next.cycleMarkers &&
    prev.currentFlowStars === next.currentFlowStars &&
    prev.flyInMutagens === next.flyInMutagens &&
    prev.yearlyAges === next.yearlyAges &&
    prev.smallLimitAges === next.smallLimitAges &&
    areDecadalRangeEqual(prev.decadalRange, next.decadalRange) &&
    prev.isOppositeWarning === next.isOppositeWarning &&
    prev.isCycleChanged === next.isCycleChanged
  );
}

const PalaceCell = memo(PalaceCellComponent, arePalaceCellPropsEqual);

export default PalaceCell;
