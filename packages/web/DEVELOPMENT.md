# 开发文档

## 架构概览

### 技术栈
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite 7** - 构建工具
- **Tailwind CSS 4** - 样式框架
- **Zustand 5** - 状态管理
- **@ziwei/core** - 紫微斗数核心引擎

### 目录结构

```
src/
├── components/          # React 组件
│   ├── layout/         # 布局组件
│   ├── chart/          # 命盘相关组件
│   ├── input/          # 输入控件
│   ├── inspector/      # 检查器组件
│   └── timeline/       # 时间轴组件
├── stores/             # Zustand 状态管理
├── types/              # TypeScript 类型定义
├── App.tsx             # 根组件
├── main.tsx            # 入口文件
└── index.css           # 全局样式
```

## 核心概念

### 1. 状态管理 (Zustand)

所有全局状态都在 `src/stores/chartStore.ts` 中管理：

```typescript
interface ChartStoreState {
  // 命盘数据
  chart: Chart | null
  trace: DerivationTrace | null
  lastBirth: BirthInfo | null

  // UI 状态
  selection: SelectionState
  layers: LayerState
  timeline: TimelineState

  // Actions
  buildFromBirth: (birth: BirthInfo) => void
  selectPalace: (index: number) => void
  selectStar: (name: string) => void
  // ...
}
```

#### 使用示例

```typescript
// 读取状态
const chart = useChartStore(s => s.chart)
const layers = useChartStore(s => s.layers)

// 调用 action
const buildFromBirth = useChartStore(s => s.buildFromBirth)
buildFromBirth({ gender: '男', datetime: '2000-01-01T08:00:00', timeIndex: 4 })
```

### 2. 选择系统

支持多选和 hover 状态：

```typescript
interface SelectionState {
  selectedPalaces: number[]      // 选中的宫位索引
  selectedStars: string[]        // 选中的星曜名称
  hoveredPalace: number | null   // hover 的宫位
  hoveredStar: string | null     // hover 的星曜
}
```

#### 交互逻辑
- **单击**：选中单个项目，清空其他选择
- **Shift+单击**：多选，toggle 选中状态
- **ESC**：清空所有选择

### 3. 图层系统

控制命盘显示内容：

```typescript
interface LayerState {
  majorStars: boolean   // 主星
  minorStars: boolean   // 辅星
  shaStars: boolean     // 煞曜
  mutagens: boolean     // 四化
  relations: boolean    // 关系线
  decadal: boolean      // 大限
}
```

#### 预设模式

```typescript
type LayerPreset = 'beginner' | 'professional' | 'clean' | 'mutagen-only'

// 预设配置
const presets = {
  beginner: { majorStars: true, minorStars: false, shaStars: false, mutagens: true },
  professional: { majorStars: true, minorStars: true, shaStars: true, mutagens: true },
  clean: { majorStars: true, minorStars: false, shaStars: false, mutagens: false },
  'mutagen-only': { majorStars: true, minorStars: false, shaStars: false, mutagens: true }
}
```

### 4. SVG 命盘布局

12 宫格采用固定布局，按地支排列：

```
巳(0,0)  午(0,1)  未(0,2)  申(0,3)
辰(1,0)  [中心面板]        酉(1,3)
卯(2,0)  [中心面板]        戌(2,3)
寅(3,0)  丑(3,1)  子(3,2)  亥(3,3)
```

#### 坐标映射

```typescript
const BRANCH_GRID_POS: Record<EarthlyBranch, GridPos> = {
  巳: { row: 0, col: 0 },
  午: { row: 0, col: 1 },
  // ...
}
```

## 扩展指南

### 添加新的图层类型

1. **更新类型定义** (`src/types/ui.ts`)

```typescript
export interface LayerState {
  // ... 现有图层
  newLayer: boolean  // 新图层
}
```

2. **更新 Store** (`src/stores/chartStore.ts`)

```typescript
function getPresetLayers(preset: LayerPreset): LayerState {
  switch (preset) {
    case 'professional':
      return {
        // ... 现有配置
        newLayer: true  // 新图层默认值
      }
  }
}
```

3. **更新 UI** (`src/components/input/LayerToggle.tsx`)

```typescript
<label>
  <input
    type="checkbox"
    checked={layers.newLayer}
    onChange={() => toggleLayer('newLayer')}
  />
  新图层
</label>
```

4. **更新渲染逻辑** (`src/components/chart/ChartSVG.tsx`)

```typescript
{layers.newLayer ? (
  <NewLayerComponent chart={chart} />
) : null}
```

### 添加新的规则集

1. **在 @ziwei/core 中注册规则集**

```typescript
// packages/core/src/rules/index.ts
export const ruleSets = {
  default: defaultRuleSet,
  zhongzhou: zhongzhouRuleSet,
  newRuleSet: newRuleSet  // 新规则集
}
```

2. **更新 UI 选择器** (`src/components/input/RuleSetSelector.tsx`)

```typescript
const RULE_SETS = [
  { id: 'default', name: '默认规则' },
  { id: 'zhongzhou', name: '中州派' },
  { id: 'newRuleSet', name: '新规则集' }
]
```

### 添加新的时间轴模式

1. **更新类型定义** (`src/types/ui.ts`)

```typescript
export interface TimelineState {
  mode: 'natal' | 'decadal' | 'yearly' | 'monthly' | 'newMode'
  // ...
}
```

2. **更新时间轴组件** (`src/components/timeline/Timeline.tsx`)

```typescript
<button onClick={() => setTimeline({ mode: 'newMode' })}>
  新模式
</button>
```

3. **实现新模式的渲染逻辑**

```typescript
if (timeline.mode === 'newMode') {
  // 渲染新模式的命盘
}
```

### 添加新的检查器面板

1. **创建新组件** (`src/components/inspector/NewPanel.tsx`)

```typescript
export default function NewPanel({ chart }: { chart: Chart }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      {/* 新面板内容 */}
    </div>
  )
}
```

2. **集成到 Inspector** (`src/components/layout/Inspector.tsx`)

```typescript
import NewPanel from '../inspector/NewPanel'

// ...

{chart ? (
  <section>
    <div className="text-xs font-semibold">New Panel</div>
    <NewPanel chart={chart} />
  </section>
) : null}
```

## 样式指南

### Tailwind CSS 约定

- **间距**：使用 `gap-*` 和 `space-*` 保持一致
- **颜色**：
  - 主色：`sky-*`（天蓝色）
  - 成功：`emerald-*`（绿色）
  - 警告：`amber-*`（琥珀色）
  - 错误：`rose-*`（玫瑰色）
  - 中性：`zinc-*`（锌灰色）

### 深色模式

使用 `dark:` 前缀定义深色模式样式：

```tsx
<div className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
  内容
</div>
```

### 响应式设计

使用 Tailwind 响应式前缀：

```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  响应式宽度
</div>
```

## 性能优化

### 1. useMemo 缓存计算

```typescript
const visibleStars = useMemo(() => {
  return getVisibleStars(palace.stars, layers)
}, [palace.stars, layers])
```

### 2. 避免不必要的重渲染

```typescript
// 只订阅需要的状态
const chart = useChartStore(s => s.chart)  // ✓
const store = useChartStore()              // ✗ 订阅所有状态
```

### 3. 事件处理优化

```typescript
// 使用 stopPropagation 避免事件冒泡
onClick={(e) => {
  e.stopPropagation()
  selectStar(star.name)
}}
```

## 调试技巧

### 1. 开启推导日志

勾选"推导日志"选项，查看引擎推导过程。

### 2. React DevTools

安装 React DevTools 浏览器扩展，查看组件树和状态。

### 3. Zustand DevTools

```typescript
import { devtools } from 'zustand/middleware'

export const useChartStore = create<ChartStoreState>()(
  devtools((set, get) => ({
    // ...
  }))
)
```

### 4. 控制台日志

```typescript
console.log('Chart:', chart)
console.log('Selection:', selection)
```

## 测试

### 单元测试

```bash
pnpm test
```

### E2E 测试

```bash
pnpm test:e2e
```

## 构建部署

### 开发构建

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

### 生产部署

构建产物在 `dist/` 目录，可部署到任何静态托管服务：

- Vercel
- Netlify
- GitHub Pages
- 自建服务器

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT
