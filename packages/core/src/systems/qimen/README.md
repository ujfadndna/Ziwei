# Qimen Engine (MVP)

## Scope
- 时家转盘奇门（72 局）
- 默认规则：`lateZi` + `by5days` + `solstice` + `default_72`
- 输出含 trace，便于对照和回归

## Ju Table Source
- 默认表：`juTables/default_72.ts`
- 来源：`qfdk/qimen` 项目中的 `JIE_QI_JU_SUAN`（已归一化为结构化表）
- 该表是 `24节气 × 上中下元` 的 72 局映射

## Ju Table Format (replaceable)

```ts
interface QimenJuTableDefinition {
  id: string;
  source: string;
  description: string;
  entries: Record<string, {
    solarTerm: string;
    recommendedDun: "yang" | "yin";
    upper: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    middle: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    lower: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  }>;
}
```

## Replace / Register a Table

```ts
import { registerQimenJuTable } from "@ziwei/core";

registerQimenJuTable({
  id: "my_72_table",
  source: "internal-reference-v1",
  description: "custom qimen mapping",
  entries: {
    冬至: { solarTerm: "冬至", recommendedDun: "yang", upper: 1, middle: 7, lower: 4 },
    // ... all 24 terms
  },
});
```

然后在 `buildQimenChart(input, { juTableId: "my_72_table" })` 中启用。
