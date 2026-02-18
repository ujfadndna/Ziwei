import { useMemo, useRef, useState, type ChangeEvent } from "react";

import { useChartStore } from "../../stores/chartStore";
import {
  buildCaseLibraryExport,
  normalizeSavedCases,
  parseCaseLibraryExport,
} from "../../utils/caseLibrary";

function todayStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function formatBirthSummary(datetime: string, gender: string): string {
  return `${datetime.replace("T", " ").replace(/:\d{2}$/, "")} · ${gender}`;
}

function formatUpdatedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function parseImportedCases(text: string) {
  const parsed = JSON.parse(text) as unknown;
  const fromExport = parseCaseLibraryExport(parsed);
  if (fromExport) return fromExport;

  if (Array.isArray(parsed)) {
    return normalizeSavedCases(parsed);
  }

  throw new Error("不支持的命例文件格式。");
}

export default function CaseLibrary() {
  const savedCases = useChartStore((s) => s.savedCases);
  const activeCaseId = useChartStore((s) => s.activeCaseId);
  const saveCurrentCase = useChartStore((s) => s.saveCurrentCase);
  const loadCaseById = useChartStore((s) => s.loadCaseById);
  const deleteCaseById = useChartStore((s) => s.deleteCaseById);
  const mergeCases = useChartStore((s) => s.mergeCases);
  const replaceCases = useChartStore((s) => s.replaceCases);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nameInput, setNameInput] = useState<string>("");
  const [replaceOnImport, setReplaceOnImport] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isBusy, setIsBusy] = useState<boolean>(false);

  const canUseDesktopFileApi = useMemo(() => {
    if (typeof window === "undefined") return false;
    return typeof window.ziweiDesktop?.exportCaseLibrary === "function";
  }, []);

  async function handleExport(): Promise<void> {
    if (savedCases.length === 0) {
      setStatusMessage("当前没有可导出的命例。");
      return;
    }

    setIsBusy(true);
    try {
      const payload = buildCaseLibraryExport(savedCases);
      const content = JSON.stringify(payload, null, 2);
      const suggestedFilename = `ziwei-cases-${todayStamp()}.json`;

      if (canUseDesktopFileApi && window.ziweiDesktop?.exportCaseLibrary) {
        const result = await window.ziweiDesktop.exportCaseLibrary({
          suggestedFilename,
          content,
        });

        if (result.canceled) {
          setStatusMessage("已取消导出。");
          return;
        }
        if (!result.ok) {
          setStatusMessage(`导出失败：${result.error}`);
          return;
        }

        setStatusMessage(`导出成功：${result.path}`);
        return;
      }

      const blob = new Blob([content], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = suggestedFilename;
      link.click();
      URL.revokeObjectURL(url);
      setStatusMessage("导出成功（浏览器下载）。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      setStatusMessage(`导出失败：${message}`);
    } finally {
      setIsBusy(false);
    }
  }

  function applyImportedCases(cases: ReturnType<typeof normalizeSavedCases>): void {
    if (replaceOnImport) {
      replaceCases(cases);
      setStatusMessage(`已覆盖导入，共 ${cases.length} 条命例。`);
      return;
    }

    const result = mergeCases(cases);
    setStatusMessage(`导入完成：新增 ${result.added} 条，更新 ${result.updated} 条。`);
  }

  async function handleImportFromDesktop(): Promise<void> {
    if (!window.ziweiDesktop?.importCaseLibrary) return;

    setIsBusy(true);
    try {
      const result = await window.ziweiDesktop.importCaseLibrary();
      if (result.canceled) {
        setStatusMessage("已取消导入。");
        return;
      }
      if (!result.ok) {
        setStatusMessage(`导入失败：${result.error}`);
        return;
      }

      const cases = parseImportedCases(result.content);
      applyImportedCases(cases);
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      setStatusMessage(`导入失败：${message}`);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleImportFromBrowserFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsBusy(true);
    try {
      const text = await file.text();
      const cases = parseImportedCases(text);
      applyImportedCases(cases);
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      setStatusMessage(`导入失败：${message}`);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleImport(): Promise<void> {
    if (canUseDesktopFileApi) {
      await handleImportFromDesktop();
      return;
    }
    fileInputRef.current?.click();
  }

  function handleSaveCurrentCase(): void {
    const result = saveCurrentCase(nameInput);
    setStatusMessage(result.message);
    if (result.ok) {
      setNameInput("");
    }
  }

  function handleDeleteCase(id: string): void {
    const ok = window.confirm("确定删除该命例吗？");
    if (!ok) return;
    deleteCaseById(id);
    setStatusMessage("命例已删除。");
  }

  return (
    <div className="space-y-2">
      <div className="text-[11px] surface-help">共 {savedCases.length} 条命例</div>

      <div className="flex gap-2">
        <input
          type="text"
          className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100"
          placeholder="命例名称（可留空）"
          value={nameInput}
          onChange={(event) => setNameInput(event.target.value)}
        />
        <button
          type="button"
          className="shrink-0 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:disabled:border-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-300"
          onClick={handleSaveCurrentCase}
          disabled={isBusy}
        >
          保存
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:disabled:border-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-300"
          onClick={() => void handleImport()}
          disabled={isBusy}
        >
          导入
        </button>
        <button
          type="button"
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:disabled:border-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-300"
          onClick={() => void handleExport()}
          disabled={isBusy}
        >
          导出
        </button>
        <label className="inline-flex items-center gap-1 text-[11px] surface-label">
          <input
            type="checkbox"
            className="rounded border-zinc-300 dark:border-slate-500"
            checked={replaceOnImport}
            onChange={(event) => setReplaceOnImport(event.target.checked)}
          />
          导入覆盖
        </label>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(event) => void handleImportFromBrowserFile(event)}
      />

      {statusMessage ? (
        <div className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-600 dark:border-slate-600/80 dark:bg-slate-900 dark:text-slate-200">
          {statusMessage}
        </div>
      ) : null}

      <div className="max-h-56 space-y-2 overflow-auto rounded-md border border-zinc-200/70 bg-white/70 p-2 dark:border-slate-600/80 dark:bg-slate-950/45">
        {savedCases.length === 0 ? (
          <div className="text-[11px] surface-help">暂无命例。先排盘，再点击“保存”。</div>
        ) : null}

        {savedCases.map((item) => {
          const isActive = item.id === activeCaseId;
          return (
            <div
              key={item.id}
              className={[
                "rounded-md border px-2 py-2",
                isActive
                  ? "border-sky-300 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/30"
                  : "border-zinc-200/80 bg-white dark:border-slate-600/80 dark:bg-slate-900/75",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-zinc-800 dark:text-slate-100">{item.name}</div>
                  <div className="truncate text-[11px] surface-help">
                    {formatBirthSummary(item.birth.datetime, item.birth.gender)}
                  </div>
                  <div className="truncate text-[11px] surface-help">
                    更新：{formatUpdatedAt(item.updatedAt)}
                  </div>
                </div>
                <div className="shrink-0 space-x-1">
                  <button
                    type="button"
                    className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[11px] text-zinc-700 hover:bg-zinc-50 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    onClick={() => loadCaseById(item.id)}
                    disabled={isBusy}
                  >
                    载入
                  </button>
                  <button
                    type="button"
                    className="rounded border border-rose-200 bg-white px-1.5 py-0.5 text-[11px] text-rose-700 hover:bg-rose-50 dark:border-rose-800/70 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                    onClick={() => handleDeleteCase(item.id)}
                    disabled={isBusy}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
