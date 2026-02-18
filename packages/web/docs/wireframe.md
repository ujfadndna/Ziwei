# Ziwei Web UI Wireframe

目标：为紫微斗数排盘提供「三栏布局 + SVG 命盘 + 交互系统」的完整 Web UI（React + Vite + Tailwind）。

---

## 信息架构（IA）

### 1) 全局布局
- Header（顶栏）
  - 产品名 / 当前规则集 / 快捷操作（暗色模式、清空选择、导出等预留）
- Main（三栏）
  - 左：Control Panel（固定宽 240px）
    - BirthForm：出生信息输入（性别、日期、时间/时辰等）
    - RuleSetSelector：规则集选择（default / zhongzhou ...）
    - LayerToggle：图层开关（主星/辅星/煞曜/四化/关系线/运限等）
  - 中：Chart Canvas（自适应）
    - ChartSVG：4x4 宫格（中间空 2x2），周边 12 宫位
    - RelationLines：三方四正、对宫等关系线（按图层显示/隐藏）
  - 右：Inspector（固定宽 320px）
    - SearchBox：星曜搜索（自动定位高亮）
    - PalaceDetail：宫位详情（宫名、干支、星曜列表）
    - StarDetail：星曜详情（类型、亮度、四化、所在宫位）
    - TraceViewer：推导日志（步骤树形/分组展示）
- Timeline（底栏，可折叠）
  - 模式：本命 / 大限 / 流年 / 流月
  - 视图：overlay / replace / diff（对比模式预留）

### 2) 核心交互
- Hover
  - 宫位 hover：高亮宫位与其三方四正关系
  - 星曜 hover：高亮星曜标签（以及其所在宫位）
- Click
  - 单击：选中宫位/星曜，Inspector 显示详情
  - Shift + 单击：多选（宫位/星曜可分别多选）
- 键盘
  - ESC：清空选中状态（并清空 hover）
- 搜索
  - 输入星名：自动定位并高亮（可按 Enter 进一步选中）

---

## ASCII 线框图（布局草图）

```
┌────────────────────────────────────────────────────────────────────────┐
│                              Header                                     │
├──────────┬─────────────────────────────────────┬───────────────────────┤
│ Control  │                                     │      Inspector        │
│ Panel    │         Chart Canvas (SVG)          │                       │
│ (240px)  │                                     │      (320px)          │
│          │    ┌───┬───┬───┬───┐               │  ┌─────────────────┐  │
│ [Input]  │    │巳 │午 │未 │申 │               │  │ Palace Detail   │  │
│ [Rules]  │    ├───┼───┼───┼───┤               │  │ Star List       │  │
│ [Layers] │    │辰 │   │   │酉 │               │  │ Trace Log       │  │
│          │    ├───┼───┼───┼───┤               │  └─────────────────┘  │
│          │    │卯 │   │   │戌 │               │                       │
│          │    ├───┼───┼───┼───┤               │                       │
│          │    │寅 │丑 │子 │亥 │               │                       │
│          │    └───┴───┴───┴───┘               │                       │
├──────────┴─────────────────────────────────────┴───────────────────────┤
│                         Timeline (collapsible)                          │
│  本命 ─── 大限(24-33) ─── 流年(2024) ─── 流月(正月)                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 组件树（建议）

- `App`
  - `AppLayout`
    - Header
    - `ControlPanel`
      - `BirthForm`
      - `RuleSetSelector`
      - `LayerToggle`
    - `ChartCanvas`
      - `ChartSVG`
        - `RelationLines`
        - `PalaceCell`
          - `StarBadge`
    - `Inspector`
      - `SearchBox`
      - `PalaceDetail`
      - `StarDetail`
      - `TraceViewer`
    - `Timeline`

