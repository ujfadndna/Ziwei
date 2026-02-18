import { useChartStore } from "../../stores/chartStore";

const RULESET_OPTIONS: Array<{ id: string; label: string; note?: string }> = [
  { id: "default", label: "default", note: "默认规则集（演示）" },
  { id: "zhongzhou", label: "zhongzhou", note: "中州派（预留）" },
];

export default function RuleSetSelector() {
  const ruleSetId = useChartStore((s) => s.ruleSetId);
  const setRuleSetId = useChartStore((s) => s.setRuleSetId);

  return (
    <div className="space-y-2">
      <label className="block">
        <div className="text-[11px] surface-label">规则集</div>
        <select
          className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100"
          value={ruleSetId}
          onChange={(e) => setRuleSetId(e.target.value)}
        >
          {RULESET_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <div className="text-[11px] surface-help">
        {RULESET_OPTIONS.find((o) => o.id === ruleSetId)?.note ?? "—"}
      </div>
    </div>
  );
}
