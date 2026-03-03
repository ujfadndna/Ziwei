<div align="center">
  <img src="logo.png" alt="Ziwei Pro Logo" width="128" height="128">
  <h1>Ziwei Pro - 紫微斗数专业排盘系统</h1>
  <p>一站式中国传统命理排盘工具，集成紫微斗数、八字、奇门遁甲、六爻四大术数系统。</p>
</div>

## 功能概览

| 系统 | 说明 | 状态 |
|------|------|------|
| 紫微斗数 | 十二宫命盘、四化飞星、大限流年 | 已完成 |
| 八字 | 四柱排盘、十神、大运流年 | 已完成 |
| 奇门遁甲 | 时家奇门、九宫格局 | 已完成 |
| 六爻 | 文王纳甲、三钱起卦、世应六亲六神 | 已完成 |

## 技术栈

- **Core** - 纯 TypeScript 算法库，零依赖
- **Web** - React 19 + Vite 7 + Tailwind CSS 4 + Zustand
- **Desktop** - Electron 31，支持 Windows 桌面端

## 项目结构

```
ziwei-pro/
├── packages/
│   ├── core/       # 核心算法（历法、五行、十神、四化、各系统推导）
│   ├── web/        # Web 前端（React SPA）
│   └── desktop/    # Electron 桌面端封装
└── docs/           # 文档
```

## 快速开始

### 环境要求

- Node.js 24+
- pnpm（推荐通过 Corepack 启用）

### 安装

```bash
corepack enable
corepack prepare pnpm@10.29.3 --activate
pnpm install
```

### 开发

```bash
# Web 开发服务器
pnpm dev

# 桌面端开发（同时启动 Web + Electron）
pnpm dev:desktop

# 类型检查
pnpm typecheck

# 运行测试
pnpm test
```

### 构建

```bash
# 构建桌面端资源
pnpm build:desktop

# 打包 Windows 安装程序（.exe）
pnpm pack:win
```

## 四大系统简介

### 紫微斗数

传统十二宫命盘排列，支持四化飞星、大限流年推演。使用 iztro 历法引擎计算。

### 八字

四柱（年月日时）排盘，含十神推导、大运排列、流年推算。

### 奇门遁甲

时家奇门排盘，九宫八门、天地人三盘叠加。

### 六爻（文王纳甲）

完整的六爻排盘系统：

- 三钱法起卦（支持手动掷币 / 自动起卦）
- 64 卦查询（文王序）
- 纳甲装卦（天干地支配六爻）
- 世应安排
- 六亲推导（生克关系）
- 六神排列（按日干）
- 旬空判定
- 本卦 / 变卦对照显示
- 全程推演日志追踪

## 许可

MIT
