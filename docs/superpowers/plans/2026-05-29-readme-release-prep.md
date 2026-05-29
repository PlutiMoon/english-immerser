# README Repair and v0.4 Release Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace corrupted public-facing docs with clean Chinese content and prepare the repository for a v0.4 release.

**Architecture:** Documentation-only change. Keep package/app versions unchanged at `0.4.0`; update README and release notes, then add a release checklist that records current artifacts and next publishing steps.

**Tech Stack:** Markdown, Tauri 2, React 18, TypeScript.

---

### Task 1: README Repair

**Files:**
- Modify: `README.md`

- [ ] Replace corrupted Chinese/English mixed content with clean Chinese-first documentation.
- [ ] Include project positioning, feature modules, tech stack, development commands, data storage, verification, and release links.

### Task 2: v0.4 Release Notes and Checklist

**Files:**
- Modify: `RELEASE_NOTES_0.4.0.md`
- Create: `docs/releases/v0.4.0-checklist.md`

- [ ] Rewrite v0.4 release notes in clean Chinese.
- [ ] Include Apple-style UI refresh, media source refactor, CSP hardening, YouTube source, statistics dashboard, writing prompts, and test count.
- [ ] Add a release checklist covering version alignment, tag state, build artifacts, updater metadata, and GitHub release actions.

### Task 3: Verification

**Files:** no code files.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Check `git status`.
