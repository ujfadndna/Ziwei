# Ziwei Web - 紫微斗数排盘系统

基于 React + Vite + Tailwind CSS 的紫微斗数专业排盘软件 Web UI。

## 功能特性

### 核心功能
- ✅ 出生信息输入（性别、日期、时间、时辰）
- ✅ 一键排盘，调用 `@ziwei/core` 引擎
- ✅ 12宫格 SVG 命盘可视化
- ✅ 交互式选择（点击宫位/星曜查看详情）
- ✅ 推导日志查看器
- ✅ 图层系统（主星/辅星/煞曜/四化/关系线）

### 八字系统（MVP）
- ✅ 顶部 Tab 新增“八字”视图（与紫微视图切换）
- ✅ `buildBaziChart(input, ruleset)` 输出：四柱、藏干、十神、五行统计、大运、流年、trace
- ✅ 默认规则固定：
  - `yearBoundary = lichun`（立春换年）
  - `ziHourRollover = lateZi`（晚子不跨日）
  - `monthPillarBy = solarTerms`（节气定月柱）
  - `useTrueSolarTime = false`
- ✅ 八字页面含：四柱卡、五行条、十神、藏干折叠面板、大运条带、流年条带、trace 调试面板

### 八字校验与测试
- 运行 `pnpm test -- packages/core/src/bazi/bazi.test.ts` 可执行八字 golden tests
- 测试覆盖：立春前后、节气月边界、晚子时段、跨时区 trace 记录
- 若你需要调整规则实现，先改 `packages/core/src/bazi/index.ts`，再更新 golden snapshot

### UI 设计
- **三栏布局**
  - 左侧控制台（280px）：出生信息表单、规则集选择、图层开关
  - 中间画布（flex-1）：SVG 命盘，12宫格布局
  - 右侧检查器（360px）：选中项详情、星曜列表、推导日志
  - 底部时间轴（可折叠）：本命→大限→流年切换

- **交互设计**
  - Hover 高亮宫位/星曜
  - Click 选中，Shift+Click 多选
  - ESC 清空选择
  - 搜索星曜并自动定位高亮

- **图层预设**
  - 入门模式：主星 + 四化
  - 专业模式：全部显示
  - 纯净模式：仅主星
  - 四化专注：主星 + 四化

## 快速开始

### 安装依赖

```bash
cd D:\Ziwei\packages\web
pnpm install
```

### 开发模式

```bash
pnpm dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
pnpm build
pnpm preview
```

## 项目结构

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      # 主布局（三栏 + 顶栏）
│   │   ├── ControlPanel.tsx   # 左侧控制台
│   │   ├── ChartCanvas.tsx    # 中间画布容器
│   │   └── Inspector.tsx      # 右侧检查器
│   ├── chart/
│   │   ├── ChartSVG.tsx       # SVG 命盘主组件
│   │   ├── PalaceCell.tsx     # 单宫位渲染
│   │   ├── StarBadge.tsx      # 星曜标签
│   │   └── RelationLines.tsx  # 关系线（三方四正）
│   ├── input/
│   │   ├── BirthForm.tsx      # 出生信息表单
│   │   ├── LayerToggle.tsx    # 图层开关
│   │   └── RuleSetSelector.tsx # 规则集选择器
│   ├── inspector/
│   │   ├── PalaceDetail.tsx   # 宫位详情
│   │   ├── StarDetail.tsx     # 星曜详情
│   │   ├── TraceViewer.tsx    # 推导日志查看器
│   │   └── SearchBox.tsx      # 星曜搜索框
│   └── timeline/
│       └── Timeline.tsx       # 时间轴（本命/大限/流年）
├── stores/
│   └── chartStore.ts          # Zustand 全局状态
├── types/
│   └── ui.ts                  # UI 状态类型定义
├── App.tsx
├── main.tsx
└── index.css                  # Tailwind CSS 配置
```

## 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand 5
- **核心引擎**: @ziwei/core (workspace)

## 使用说明

### 1. 输入出生信息
在左侧控制台填写：
- 性别：男/女
- 日期：公历日期
- 时间：24小时制
- 时辰：自动根据时间推算，也可手动选择

### 2. 排盘
点击"排盘"按钮，系统将调用 `@ziwei/core` 引擎生成命盘。

### 3. 查看命盘
- 中间画布显示 12 宫格命盘
- 每个宫位显示：宫名、地支、天干、星曜列表
- 命宫标记为红色边框，身宫标记为蓝色角标

### 4. 交互操作
- **点击宫位**：在右侧检查器显示宫位详情
- **点击星曜**：显示星曜详情和推导日志
- **Shift+Click**：多选宫位/星曜
- **ESC**：清空所有选择
- **搜索**：在右侧搜索框输入星曜名称，自动定位并高亮

### 5. 图层控制
在左侧控制台切换图层：
- 主星：紫微、天机、太阳等 14 主星
- 辅星：文昌、文曲、左辅、右弼等
- 煞曜：擎羊、陀罗、火星、铃星等
- 四化：禄、权、科、忌
- 关系线：三方四正连线
- 大限：大限宫位标记

### 6. 推导日志
勾选"推导日志"选项后排盘，可在右侧检查器查看详细的推导过程，用于学习和调试。

## 样式设计

- **深色主题**：支持浅色/深色模式切换
- **宫位颜色**：
  - 命宫：红色边框
  - 身宫：蓝色角标
  - 选中：黄色高亮
  - Hover：灰色背景
- **星曜颜色**：
  - 主星：黄色
  - 辅星：蓝色
  - 煞曜：红色
  - 四化：绿色（禄）、紫色（权）、蓝色（科）、红色（忌）

## 开发指南

### 添加新功能
1. 在 `src/types/ui.ts` 定义新的状态类型
2. 在 `src/stores/chartStore.ts` 添加状态和 actions
3. 创建对应的 React 组件
4. 在 `AppLayout.tsx` 中集成

### 调试技巧
- 开启"推导日志"查看引擎推导过程
- 使用 React DevTools 查看组件状态
- 使用 Zustand DevTools 查看全局状态变化

## 许可证

MIT
