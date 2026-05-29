# Media Source Split and Surface Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish splitting the player media source UI and complete Apple-style surface class adoption across the remaining local components.

**Architecture:** Keep `MediaSource.tsx` as the tab container and state coordinator. Move each tab body into focused child components under `src/components/player/media-source/`, sharing a small `types.ts` for local prop types. Replace repeated local surface class strings with the existing `.surface-card`, `.surface-panel`, and `.surface-muted` utility classes.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest, Vite, Tauri 2.

---

### Task 1: Split MediaSource Panels

**Files:**
- Create: `src/components/player/media-source/types.ts`
- Create: `src/components/player/media-source/LocalFilePanel.tsx`
- Create: `src/components/player/media-source/UrlPanel.tsx`
- Create: `src/components/player/media-source/PodcastPanel.tsx`
- Create: `src/components/player/media-source/YouTubePanel.tsx`
- Modify: `src/components/player/MediaSource.tsx`

- [x] Move tab-specific JSX into child components.
- [x] Keep existing state, handlers, labels, toast behavior, and Tauri command calls unchanged.
- [x] Keep `MediaSource.tsx` responsible for active tab and handler wiring only.

### Task 2: Complete Surface Utility Adoption

**Files:**
- Modify remaining files reported by `rg "rounded-xl bg-white|bg-gray-50 border border-gray-100" src/scenes src/components`.

- [x] Replace simple card containers with `surface-card`.
- [x] Replace soft inset/empty containers with `surface-muted`.
- [x] Leave semantic warning/error/success surfaces unchanged.

### Task 3: Verification

**Files:**
- No new files.

- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Run `cargo check` in `src-tauri`.
- [x] Browser smoke-check the seven sidebar scenes.
