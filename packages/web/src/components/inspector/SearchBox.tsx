import { useChartStore } from "../../stores/chartStore";

export default function SearchBox() {
  const chart = useChartStore((s) => s.chart);
  const searchQuery = useChartStore((s) => s.searchQuery);
  const searchResult = useChartStore((s) => s.searchResult);
  const setSearchQuery = useChartStore((s) => s.setSearchQuery);
  const selectSearchResult = useChartStore((s) => s.selectSearchResult);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide surface-label">
          Search
        </div>
        {searchQuery ? (
          <button
            type="button"
            className="text-[11px] surface-label hover:text-zinc-700 dark:hover:text-slate-100"
            onClick={() => setSearchQuery("")}
          >
            清空
          </button>
        ) : null}
      </div>

      <input
        type="text"
        placeholder={chart ? "输入星名（例如：紫微、擎羊…）" : "请先生成命盘"}
        className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={!chart}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            selectSearchResult();
          }
        }}
      />

      <div className="text-[11px] surface-help">
        {searchQuery.trim() ? (
          searchResult ? (
            <>
              命中：<span className="font-semibold">{searchResult.starName}</span>（宫位索引 {searchResult.palaceIndex}）
              <span className="ml-2">按 Enter 选中</span>
            </>
          ) : (
            <>未找到匹配星曜</>
          )
        ) : (
          <>输入星名可在命盘中自动定位高亮</>
        )}
      </div>
    </div>
  );
}
