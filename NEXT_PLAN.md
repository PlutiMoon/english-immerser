# Next Plan

## Goal

Continue improving English Immerser as a stable local-first desktop learning tool. Focus on storage reliability, state ownership, and learning-loop depth.

## Status: 2026-05-24

Phases 1-9 done. 94 tests (vitest). No component/scene imports `@tauri-apps/plugin-fs` directly.

---

## Phase 7 - Writing Module Ownership Cleanup

Status: Done

Moved writing and diary FS operations from components/scenes into `writingStore`.

Completed:

- `WritingScene` now uses store actions for create/read/save/delete.
- `DiaryView` now uses store actions for history/read/save/delete.
- `HubScene` reads diary count from `writingStore`.
- Added `src/utils/writingFiles.ts` and focused tests.
- Validation passed: `npm test`, `npm run build`, `cargo check`.

---

## Phase 8 - Backup & Portability

Status: Done

- One-click export all user data as a single backup JSON file
- One-click import/restore
- Backup contents: JSON data + writing txt + diary txt + recording metadata + optional .webm

---

## Phase 9 - Polish

Status: Done

- WordCard mediaTimestamp click now jumps to PlayerScene and seeks to the saved position
- `checkin` now lives in `checkinStore`
- Rust-side RSS parsing tests added

---

## Start Here

[ ] Optional: split backup UI into a dedicated settings/tools scene
