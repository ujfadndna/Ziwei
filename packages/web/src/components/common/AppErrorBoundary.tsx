import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
  scope?: string;
}

interface AppErrorBoundaryState {
  error: Error | null;
  detail: string;
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : "Unknown runtime error");
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null, detail: "" };

  static getDerivedStateFromError(error: unknown): Partial<AppErrorBoundaryState> {
    return { error: normalizeError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    const normalized = normalizeError(error);
    const scope = this.props.scope ?? "app";
    const detail = `${normalized.message}\n${info.componentStack}`.trim();
    this.setState({ detail });
    // Keep a full console trace for debugging in desktop runtime.
    console.error(`[${scope}] runtime render error`, normalized, info.componentStack);
  }

  private onRetry = (): void => {
    this.setState({ error: null, detail: "" });
  };

  render() {
    const { error, detail } = this.state;
    if (!error) return this.props.children;

    return (
      <div data-surface="dark" className="h-full w-full p-3">
        <div className="h-full w-full rounded-xl ink-panel hud-corners p-4 flex flex-col gap-3">
          <div className="text-base font-semibold text-rose-200">界面发生异常，已阻止黑屏</div>
          <div className="text-sm surface-help">你可以点击“重试”，或“刷新应用”恢复。</div>
          <div className="rounded-md border border-rose-700/70 bg-rose-950/35 px-2 py-2 text-xs text-rose-100 whitespace-pre-wrap break-all">
            {error.message}
          </div>
          {detail ? (
            <details className="rounded-md border border-slate-600/80 bg-slate-950/40 px-2 py-2 text-[11px] text-slate-300">
              <summary className="cursor-pointer select-none">错误详情</summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">{detail}</pre>
            </details>
          ) : null}
          <div className="mt-auto flex items-center gap-2">
            <button type="button" className="hud-chip is-active" onClick={this.onRetry}>
              重试
            </button>
            <button type="button" className="hud-chip" onClick={() => window.location.reload()}>
              刷新应用
            </button>
          </div>
        </div>
      </div>
    );
  }
}

