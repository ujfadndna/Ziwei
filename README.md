# ziwei-pro

Monorepo bootstrap for a Ziwei Doushu (Purple Star Astrology) charting project.

## Requirements

- Node.js (tested with Node 24+)
- pnpm (recommended via Corepack)

## Setup

Enable pnpm via Corepack (recommended):

```bash
corepack enable
corepack prepare pnpm@10.29.3 --activate
```

Install dependencies:

```bash
pnpm install
```

## Workspace Layout

- `packages/core` - core TypeScript library (domain logic)
- `packages/web` - Vite + React web app

## Useful Commands

```bash
# Run the web app dev server
pnpm dev

# Run desktop app in development mode (starts web + Electron)
pnpm dev:desktop

# Type-check (project references)
pnpm typecheck

# Run tests (Vitest)
pnpm test

# Build desktop assets (web dist + Electron main/preload dist)
pnpm build:desktop

# Package Windows desktop app (.exe installer + portable)
pnpm pack:win
```
