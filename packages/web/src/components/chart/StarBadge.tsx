import type { Star } from "@ziwei/core";

import type { MouseEvent } from "react";

const SHA_STAR_SET = new Set<string>(["擎羊", "陀罗", "火星", "铃星", "地空", "地劫"]);

export function isShaStarName(name: string): boolean {
  return SHA_STAR_SET.has(name);
}

export interface StarBadgeProps {
  star: Star;
  compact?: boolean;
  showMutagen?: boolean;
  highlight?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function getTone(star: Star): "major" | "minor" | "sha" | "other" {
  if (isShaStarName(star.name)) return "sha";
  if (star.type === "major") return "major";
  if (star.type === "minor") return "minor";
  return "other";
}

export default function StarBadge(props: StarBadgeProps) {
  const { star, compact, showMutagen, highlight, onClick, onMouseEnter, onMouseLeave } = props;

  const tone = getTone(star);

  const base =
    "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-medium leading-none transition-colors";
  const size = compact ? "text-[10px]" : "text-[11px]";

  const palette =
    tone === "major"
      ? "border-amber-800/60 bg-amber-950/40 text-amber-200 hover:bg-amber-900/55"
      : tone === "minor"
        ? "border-sky-800/60 bg-sky-950/40 text-sky-200 hover:bg-sky-900/55"
        : tone === "sha"
          ? "border-rose-800/60 bg-rose-950/40 text-rose-200 hover:bg-rose-900/55"
          : "border-slate-700 bg-slate-950/45 text-slate-200 hover:bg-slate-900/55";

  const ring = highlight ? "ring-2 ring-sky-400/70 dark:ring-sky-500/70" : "";

  const mutagenPill = (() => {
    if (!showMutagen || !star.mutagen) return null;
    const t = star.mutagen.type;
    const tColor =
      t === "化禄"
        ? "bg-emerald-600"
        : t === "化权"
          ? "bg-amber-600"
          : t === "化科"
            ? "bg-sky-600"
            : "bg-rose-600";

    return (
      <span
        className={`inline-flex items-center rounded px-1 py-[1px] text-[9px] font-semibold text-white ${tColor}`}
        title={`${t}（${star.mutagen.source}）`}
      >
        {t.replace("化", "")}
      </span>
    );
  })();

  const brightnessPill = star.brightness ? (
    <span
      className="inline-flex items-center rounded border border-slate-700 bg-slate-950/70 px-1 py-[1px] text-[9px] text-slate-300"
      title={`亮度：${star.brightness}`}
    >
      {star.brightness}
    </span>
  ) : null;

  return (
    <button
      type="button"
      className={`${base} ${size} ${palette} ${ring}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={star.name}
    >
      <span>{star.name}</span>
      {mutagenPill}
      {brightnessPill}
    </button>
  );
}
