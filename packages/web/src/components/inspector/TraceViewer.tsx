import type { DerivationStep, DerivationTrace } from "@ziwei/core";

import { useMemo } from "react";

import { useChartStore } from "../../stores/chartStore";

export interface TraceViewerProps {
  trace: DerivationTrace;
}

function safeStringify(value: unknown): string {
  try {
    const text = JSON.stringify(
      value,
      (_k, v) => {
        if (typeof v === "bigint") return String(v);
        return v;
      },
      2
    );
    if (!text) return "";
    const limit = 3500;
    return text.length > limit ? `${text.slice(0, limit)}\n…(truncated)` : text;
  } catch {
    return String(value);
  }
}

function labelForStep(step: DerivationStep): string {
  const base = `${step.type} · ${step.description}`;
  const hint = [
    step.palaceIndex != null ? `palace=${step.palaceIndex}` : null,
    step.starName ? `star=${step.starName}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  return hint ? `${base} (${hint})` : base;
}

export default function TraceViewer(props: TraceViewerProps) {
  const { trace } = props;

  const selection = useChartStore((s) => s.selection);
  const selectPalace = useChartStore((s) => s.selectPalace);
  const selectStar = useChartStore((s) => s.selectStar);

  const grouped = useMemo(() => {
    const buckets = new Map<string, DerivationStep[]>();
    for (const step of trace.steps) {
      const key = step.type;
      const list = buckets.get(key) ?? [];
      list.push(step);
      buckets.set(key, list);
    }
    return Array.from(buckets.entries());
  }, [trace.steps]);

  return (
    <div
      data-surface="dark"
      className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {trace.warnings && trace.warnings.length > 0 ? (
        <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="font-semibold">Warnings</div>
          <div className="mt-1 whitespace-pre-wrap">{trace.warnings.join("\n")}</div>
        </div>
      ) : null}

      <div className="space-y-2">
        {grouped.map(([type, steps]) => (
          <details key={type} className="rounded-md border border-zinc-200 dark:border-zinc-800" open={type === "calendar"}>
            <summary className="cursor-pointer select-none px-2 py-1 text-xs font-semibold surface-value hover:bg-zinc-50 dark:hover:bg-zinc-800">
              {type} <span className="ml-1 text-xs font-normal surface-label">({steps.length})</span>
            </summary>
            <div className="p-2 space-y-2">
              {steps.map((step) => {
                const isRelatedPalace =
                  step.palaceIndex != null && selection.selectedPalaces.includes(step.palaceIndex);
                const isRelatedStar =
                  step.starName != null && selection.selectedStars.includes(step.starName);
                const isRelated = isRelatedPalace || isRelatedStar;

                return (
                  <details
                    key={step.id}
                    className={[
                      "rounded-md border p-2",
                      isRelated
                        ? "border-sky-300 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/30"
                        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/30",
                    ].join(" ")}
                  >
                    <summary className="cursor-pointer select-none text-xs font-semibold surface-value">
                      {labelForStep(step)}
                    </summary>

                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {step.palaceIndex != null ? (
                          <button
                            type="button"
                            className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs font-medium surface-value hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                            onClick={() => selectPalace(step.palaceIndex!, { additive: false })}
                          >
                            选中宫位 {step.palaceIndex}
                          </button>
                        ) : null}
                        {step.starName ? (
                          <button
                            type="button"
                            className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs font-medium surface-value hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                            onClick={() => selectStar(step.starName!, { additive: false })}
                          >
                            选中星曜 {step.starName}
                          </button>
                        ) : null}
                      </div>

                      {step.input !== undefined ? (
                        <div>
                          <div className="text-xs font-semibold surface-label">input</div>
                          <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-zinc-950 p-2 text-[11px] leading-relaxed text-zinc-100">
                            {safeStringify(step.input)}
                          </pre>
                        </div>
                      ) : null}

                      {step.output !== undefined ? (
                        <div>
                          <div className="text-xs font-semibold surface-label">output</div>
                          <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-zinc-950 p-2 text-[11px] leading-relaxed text-zinc-100">
                            {safeStringify(step.output)}
                          </pre>
                        </div>
                      ) : null}

                      {step.warnings && step.warnings.length > 0 ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                          <div className="font-semibold">warnings</div>
                          <div className="mt-1 whitespace-pre-wrap">{step.warnings.join("\n")}</div>
                        </div>
                      ) : null}

                      {step.error ? (
                        <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                          <div className="font-semibold">error</div>
                          <div className="mt-1 whitespace-pre-wrap">{step.error.message}</div>
                        </div>
                      ) : null}
                    </div>
                  </details>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
