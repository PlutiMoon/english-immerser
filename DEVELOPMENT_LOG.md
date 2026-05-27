# Development Log

## 2026-05-24 - Icon System Polish

### Summary

This pass introduced a unified 24px line-icon set and replaced the last raw emoji / glyph-style action markers in the core UI with consistent SVG icons.

### Changed

- Added `src/components/icons/AppIcons.tsx` as the shared icon library.
- Replaced remaining play/pause, delete, and streak symbols in the main scenes and lists.
- Standardized toast icon sizing.

### Validation

Commands run successfully:

```bash
npm test
npm run build
cargo check
```

Current test count: 98 passing tests across 8 files.

## 2026-05-24 - Release Notes and Packaging Cleanup

### Summary

This pass tightened the 0.3.0 packaging story by adding a dedicated release-notes file and refreshing the README backup guidance so the export/import flow, pre-import backup, and schema compatibility rules are visible in one place.

### Changed

- Added `RELEASE_NOTES_0.3.0.md`.
- Updated `README.md` with backup notes and release-note linkage.
- Updated `CLAUDE.md` and `PLAN.md` to match the current store-based architecture and backup packaging flow.

### Validation

Docs-only pass; no code validation rerun was needed.

## 2026-05-24 - Backup Schema Version Policy

### Summary

This pass added an explicit manifest compatibility policy for backups. The app now rejects newer or older backup schema versions with a clear message instead of treating them as generic format errors.

### Changed

- Added schema-version support checks in `src/utils/backupCore.ts`.
- Added tests for future and older backup schema versions.
- Kept current backups on schema version `1`.

### Validation

Commands run successfully:

```bash
npm test
npm run build
cargo check
```

Current test count: 98 passing tests across 8 files.

## 2026-05-24 - Player Store Extraction

### Summary

This pass moved the in-memory player state out of `AppData` and into a dedicated Zustand store. Player source, recent sources, saved positions, and loop bookmarks now live in `src/stores/playerStore.ts`, and scenes talk to the store directly.

### Changed

- Added `src/stores/playerStore.ts`.
- Removed `AppData`, `DEFAULT_APP_DATA`, and `src/data.ts`.
- Updated `App.tsx` to stop carrying player state through props.
- Updated `PlayerScene`, `VocabularyScene`, and `DictationScene` to read and write player state from the store.

### Validation

Commands run successfully:

```bash
npm test
npm run build
cargo check
```

Current test count: 95 passing tests across 8 files.

## 2026-05-24 - Recovery Notice Helper and Backup Round-Trip Tests

### Summary

This pass removed the repeated JSON recovery toast string building from the scenes and added a backup export/import round-trip test that exercises JSON, text, diary, and recording assets together.

### Changed

- Added `src/utils/recoveryNotice.ts` for shared recovery toast formatting.
- Updated `App.tsx` and the JSON-backed scenes to use the shared helper.
- Added `tests/backup.test.ts` to cover backup export/import consistency.

### Validation

Commands run successfully:

```bash
npm test
npm run build
cargo check
```

Current test count: 95 passing tests across 8 files.

## 2026-05-24 - Backup Consistency and Release Cleanup

### Summary

This pass fixed the last two backup/release consistency bugs: backup manifest versioning now matches the current app release, and the recording export toggle now applies to both recording metadata and `.webm` audio so restores stay internally consistent. The old no-op `saveAllData` chain was removed, and the sidebar version label now matches the shipped release.

### Changed

- Updated backup manifest version to `0.3.0`.
- Made recording backup inclusion apply to both `recordings.json` and `.webm` files.
- Removed the dead `saveAllData` auto-save path from `App.tsx` and `data.ts`.
- Updated the sidebar version label to `v0.3.0`.

### Validation

Commands run successfully:

```bash
npm test
npm run build
cargo check
```

Current test count: 94 passing tests across 7 files.

## 2026-05-24 - Polish Pass: Vocabulary Jump, Check-In Store, RSS Tests

### Summary

This pass finished the last polish items. Vocabulary cards can now jump back into the player at the saved media timestamp, check-in history has its own store, and the Rust RSS parser now has direct tests.

### Added

- Added `src/stores/checkinStore.ts`.
- Added clickable media timestamps to `WordCard`.
- Added Rust RSS parser tests in `src-tauri/src/commands.rs`.

### Changed

- Removed `checkin` from `AppData`.
- Updated `HubScene` to read and write check-in state from `checkinStore`.
- Updated `VocabularyScene` to jump to `PlayerScene` and restore the target timestamp when a card timestamp is clicked.

### Validation

Commands run successfully:

```bash
npm test
npm run build
cargo check
```

Current test count: 94 passing tests across 7 files.

## 2026-05-24 - Backup Export and Restore

### Summary

This pass added a single-file local backup format for the app's user data. The backup flow can export the current local state, import a backup file, and create a pre-import safety backup before applying changes.

### Added

- Added `src/utils/backupCore.ts` for backup manifest and payload validation.
- Added `src/utils/backup.ts` for data export/import against the local app-data directory.
- Added `tests/backupCore.test.ts`.

### Changed

- Added a backup section to `HubScene`.
- Export now downloads a single JSON backup file containing:
  - app JSON data;
  - writing text files;
  - diary text files;
  - recording metadata;
  - optional `.webm` recordings.
- Import now:
  - validates payload structure;
  - writes a pre-import backup into the data directory;
  - applies the imported payload;
  - rolls back to the previous payload if application fails.

### Validation

Commands run successfully:

```bash
npm test
npm run build
cargo check
```

Current test count: 94 passing tests across 7 files.

## 2026-05-24 - Writing and Diary Store Ownership Cleanup

### Summary

This pass finished the writing-module ownership cleanup. Free-writing and diary file operations now live in `writingStore`, so React scenes/components no longer import Tauri filesystem APIs directly.

### Added

- Added `src/utils/writingFiles.ts` for pure writing-file and diary filename helpers.
- Added `tests/writingFiles.test.ts`.
- Added writing store actions for:
  - creating, reading, saving, and deleting free-writing files;
  - loading diary history;
  - reading, saving, and deleting diary entries.

### Changed

- Updated `WritingScene` to use `writingStore` actions instead of direct FS calls.
- Updated `DiaryView` to use `writingStore` actions for all diary persistence.
- Updated `HubScene` to read diary count from `writingStore`.

### Validation

Commands run successfully:

```bash
npm test
npm run build
cargo check
```

Current test count: 88 passing tests across 6 files.

## 2026-05-24 - JSON Storage Hardening

### Summary

This pass added a shared JSON storage helper and moved the important JSON-backed domains onto it. The goal was to protect local user data before adding more learning features.

### Added

- Added `src/utils/jsonStorage.ts` for JSON array persistence.
- Added backup-before-overwrite behavior using same-path `.bak` files.
- Added corrupted JSON recovery:
  - parse failures are moved to timestamped `.corrupt-*.bak` files;
  - the active JSON file is recreated with a safe default array.
- Added invalid-record cleanup:
  - mixed valid/invalid arrays are backed up;
  - valid records are preserved and written back.

### Changed

- `src/data.ts` now loads and saves `vocabulary.json`, `checkin.json`, and `recordings.json` through the shared storage helper.
- `dictationStore` now uses the shared helper for `dictation.json`.
- `podcastStore` now uses the shared helper for `podcast_feeds.json`.
- `loadAllData` now returns both app data and recovery notices.
- `App.tsx` now shows warning toasts when centralized data files are recovered.

### Validation

Commands run successfully:

```bash
npm run build
cargo check
```

## 2026-05-24 - Recording Store Ownership Migration

### Summary

This pass moved recording history ownership out of global `AppData` and into a dedicated Zustand store. Recording metadata now follows the same owner-per-domain rule already used by dictation and podcasts.

### Added

- Added `src/stores/recordingStore.ts`.
- The store owns:
  - loading `recordings.json`;
  - adding saved recording metadata;
  - removing deleted recording metadata;
  - fallback scanning of `.webm` files when metadata is empty.

### Changed

- Removed `recordingHistory` from `AppData` and `DEFAULT_APP_DATA`.
- Removed `recordings.json` from centralized `saveAllData`.
- Updated `RecordingScene` to read `history` and `loaded` from `useRecordingStore`.
- Updated recording delete flow so metadata persistence is awaited and can roll back on failure.

### Validation

Commands run successfully:

```bash
npm run build
cargo check
```

## 2026-05-24 - Writing Store Ownership Migration

### Summary

This pass moved free-writing file-list ownership out of global `AppData` and into a dedicated Zustand store. Writing content still stays as local `.txt` files, but the UI no longer relies on centralized app data to track the file list.

### Added

- Added `src/stores/writingStore.ts`.
- The store owns:
  - scanning `writing/*.txt`;
  - loading the free-writing file list;
  - adding or updating file metadata after saves;
  - removing file metadata after deletes.

### Changed

- Removed `writingFiles` from `AppData` and `DEFAULT_APP_DATA`.
- Removed writing directory scanning from `loadAllData`.
- Updated `WritingScene` to read `files` and `loaded` from `useWritingStore`.
- Updated `FileList` delete handling to await async deletion.

### Validation

Commands run successfully:

```bash
npm run build
cargo check
```

## 2026-05-24 - JSON Storage Focused Tests

### Summary

This pass made the JSON recovery logic testable without adding a test framework. The storage parser is now separated from Tauri filesystem calls, and a lightweight Node-based test script covers the key recovery branches.

### Added

- Added `src/utils/jsonStorageCore.ts` for pure JSON array parse and validation decisions.
- Added `tests/jsonStorage.test.ts`.
- Added `tsconfig.test.json`.
- Added `scripts/fix-test-imports.mjs` to make compiled ESM test imports executable in Node.
- Added `npm test`.
- Added `.tmp-tests/` to `.gitignore`.

### Covered

- Missing file input returns the default array without marking recovery.
- Invalid JSON returns the default array with `parse-error`.
- Non-array JSON returns the default array with `invalid-shape`.
- Arrays with invalid records are filtered and report `invalidCount`.
- Valid arrays pass through unchanged.

### Validation

Commands run successfully:

```bash
npm test
npm run build
cargo check
```

## 2026-05-23 - Stability and Data Ownership Pass

### Summary

This pass focused on making the app more reliable for real local desktop usage and reducing duplicated data ownership. The main bug fixed was local media playback in Tauri: the app was passing raw Windows paths directly into media elements, which is not reliable in a WebView. The app now authorizes selected files through Tauri and uses `asset:` URLs for playback.

### Fixed

- Fixed local audio/video playback for files selected through the player.
- Fixed historical recording playback using local file paths.
- Added runtime media-file authorization through a new Tauri command:
  - `allow_media_file`
- Enabled Tauri asset protocol support:
  - `app.security.assetProtocol.enable`
  - Cargo feature `protocol-asset`
- Prevented playback rate and volume changes from reloading the active media source.

### Improved

- Added user-visible toast feedback for common failures and successful actions across:
  - player;
  - podcast loading and download;
  - recording;
  - writing;
  - diary;
  - vocabulary data directory access;
  - dictation.
- Replaced one blocking `alert` in podcast download failure handling with toast feedback.
- Added a shared frontend helper:
  - `src/utils/mediaAsset.ts`

### Data Layer Changes

- Removed `dictation` from centralized `AppData`.
- Removed `podcastFeeds` from centralized `AppData`.
- `dictationStore` now owns `dictation.json`.
- `podcastStore` now owns `podcast_feeds.json`.
- `DictationScene` now reads store state directly instead of using `AppData` as a bridge.
- Dictation delete now uses rollback if writing the updated file fails.

### Validation

Commands run successfully:

```bash
npm run build
cargo check
```

### Notes

- This pass intentionally avoided a full state-management rewrite.
- The project still has direct file-write workflows in writing and recording modules. Those should be migrated carefully in later phases rather than folded into `AppData`.
