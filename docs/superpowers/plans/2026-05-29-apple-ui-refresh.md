# Apple UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle English Immerser with the approved macOS Glass direction while preserving all existing learning workflows.

**Architecture:** This is a presentation-layer refresh. Global tokens live in `tailwind.config.js` and `src/app.css`; the app shell and navigation are refined in `src/App.tsx` and `src/components/layout/Sidebar.tsx`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite, Tauri 2.

---

## File Structure

- Modify `tailwind.config.js`: replace warm primary tokens with Apple-style blue and neutral surfaces used by Tailwind utilities.
- Modify `src/app.css`: update CSS variables, base background, reusable cards, buttons, inputs, tabs, modals, toasts, scrollbars, and visual helpers.
- Modify `src/App.tsx`: make the root app shell use the new macOS canvas and update loading skeletons.
- Modify `src/components/layout/Sidebar.tsx`: make navigation a frosted macOS-style sidebar with blue active states.

## Task 1: Global Design Tokens

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/app.css`

- [ ] **Step 1: Replace warm primary palette**

In `tailwind.config.js`, change `primary` to Apple blue shades and keep `warm` as a quiet secondary accent:

```js
primary: {
  50: "#eef6ff",
  100: "#d9ecff",
  200: "#b9dcff",
  300: "#8bc7ff",
  400: "#52a8ff",
  500: "#007aff",
  600: "#006ee6",
  700: "#005bbf",
  800: "#004b99",
  900: "#003f7a",
  950: "#00284d",
}
```

- [ ] **Step 2: Update CSS variables**

In `src/app.css`, replace primary/warm variables with the same blue-based primary system, add surface variables, and make shadows softer:

```css
--color-surface-glass: rgba(255, 255, 255, 0.72);
--color-surface-strong: rgba(255, 255, 255, 0.9);
--color-border-glass: rgba(255, 255, 255, 0.76);
--shadow-sm: 0 1px 2px rgba(20, 27, 43, 0.05), 0 8px 28px rgba(20, 27, 43, 0.04);
```

- [ ] **Step 3: Verify token build**

Run: `npm run build`

Expected: TypeScript and Vite build succeed without CSS or class generation errors.

## Task 2: App Shell and Sidebar

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/app.css`

- [ ] **Step 1: Update app shell**

Change the root container to include a macOS canvas class and make `main` use `app-main` instead of a flat gray Tailwind background.

- [ ] **Step 2: Update sidebar classes**

Use a frosted sidebar surface, compact header, system-blue active nav item, and a subtle version footer.

- [ ] **Step 3: Verify navigation still works**

Start the app with `npm run dev -- --host 127.0.0.1 --port 5173`, open the UI, and click each sidebar item.

Expected: each scene renders and the active item moves correctly.

## Task 3: Shared Component Polish

**Files:**
- Modify: `src/app.css`

- [ ] **Step 1: Restyle cards and stat cards**

Make `.card`, `.stat-card`, `.tip-card`, `.empty-state`, and skeleton surfaces use translucent white, glass borders, and soft shadows.

- [ ] **Step 2: Restyle controls**

Make `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input`, `.textarea`, `.select`, and `.tab-bar` match Apple system controls.

- [ ] **Step 3: Restyle feedback surfaces**

Make `.modal-content`, `.toast`, and scrollbar styling match the lighter system surface.

- [ ] **Step 4: Verify visual consistency**

Use browser screenshots at desktop size.

Expected: no blank page, no obvious overlap, readable contrast, and all core screens share the same blue/glass system.

## Task 4: Final Verification

**Files:**
- No code files beyond Tasks 1-3.

- [ ] **Step 1: Run production build**

Run: `npm run build`

Expected: build completes successfully.

- [ ] **Step 2: Check Git diff**

Run: `git diff --stat`

Expected: changes are limited to UI styling files and plan/spec docs.

- [ ] **Step 3: Commit implementation**

Commit message:

```bash
git add tailwind.config.js src/app.css src/App.tsx src/components/layout/Sidebar.tsx docs/superpowers/plans/2026-05-29-apple-ui-refresh.md
git commit -m "style: refresh ui with macos glass design"
```
