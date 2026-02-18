import type { PointerEvent as ReactPointerEvent } from "react";

import BirthForm from "../input/BirthForm";
import CaseLibrary from "../input/CaseLibrary";
import LayerToggle from "../input/LayerToggle";
import RuleSetSelector from "../input/RuleSetSelector";

interface ControlPanelProps {
  width: number;
  onResizeStart: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

export default function ControlPanel(props: ControlPanelProps) {
  const { width, onResizeStart } = props;
  return (
    <aside
      data-surface="dark"
      className="relative shrink-0 overflow-auto border-r hud-divider-subtle p-2 hud-panel"
      style={{ width: `${width}px` }}
    >
      <div className="space-y-2">
        <section className="space-y-2 rounded-lg p-1.5 ink-soft hud-corners">
          <div className="text-xs font-semibold uppercase tracking-wide surface-label">Input</div>
          <BirthForm />
        </section>

        <details className="rounded-lg p-1.5 ink-soft hud-corners">
          <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide surface-label">
            Cases
          </summary>
          <div className="mt-2">
            <CaseLibrary />
          </div>
        </details>

        <details className="rounded-lg p-1.5 ink-soft hud-corners">
          <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide surface-label">
            Rules
          </summary>
          <div className="mt-2">
            <RuleSetSelector />
          </div>
        </details>

        <details className="rounded-lg p-1.5 ink-soft hud-corners">
          <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide surface-label">
            Layers
          </summary>
          <div className="mt-2">
            <LayerToggle />
          </div>
        </details>
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="调整左侧输入区宽度"
        title="拖动调整左侧输入区宽度"
        className="hud-resize-handle absolute inset-y-0 -right-1 z-20 hidden lg:block"
        data-axis="x"
        data-side="end"
        onPointerDown={onResizeStart}
      />
    </aside>
  );
}
