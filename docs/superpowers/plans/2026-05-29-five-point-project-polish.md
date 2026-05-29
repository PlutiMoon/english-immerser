# Five Point Project Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the five project improvements identified after the v0.4 Apple UI refresh.

**Architecture:** Keep behavior unchanged. Use a new remote `v0.4` branch for non-destructive publishing, add reusable Apple-style surface utilities, tighten Tauri security config, split one player helper component out of `MediaSource`, and add a lightweight static UI smoke test.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest, Tauri 2.

---

### Task 1: Branch Publishing

**Files:** none.

- [x] Push current `v0.4` to `origin/v0.4` using a regular non-force push.

### Task 2: Apple Surface Utilities

**Files:**
- Modify: `src/app.css`
- Modify selected UI files that still duplicate surface classes.

- [x] Add reusable `.surface-card`, `.surface-panel`, `.surface-muted`, `.button-glass`, and `.input-glass` classes.
- [x] Replace repeated `bg-white border-gray-100 shadow-sm` groups in key shared/local UI files.

### Task 3: Tauri CSP

**Files:**
- Modify: `src-tauri/tauri.conf.json`

- [x] Replace `csp: null` with a constrained policy that allows local app assets, Tauri IPC, asset protocol, remote media URLs, and Vite dev WebSocket connections.

### Task 4: Split MediaSource

**Files:**
- Create: `src/components/player/AddCustomFeed.tsx`
- Modify: `src/components/player/MediaSource.tsx`

- [x] Move the `AddCustomFeed` component into its own file.
- [x] Import it from `MediaSource.tsx` without changing behavior or strings.

### Task 5: UI Smoke Test

**Files:**
- Create: `tests/uiSmoke.test.ts`

- [x] Add a static smoke test that verifies App scene registration, Sidebar scene coverage, and the Apple shell/sidebar classes.
- [x] Run `npm test`, `npm run build`, and `cargo check`.
