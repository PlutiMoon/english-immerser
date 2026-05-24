# Work Memory

Date: 2026-05-24

## Current Project State

English Immerser is a Tauri 2 + React + TypeScript desktop app for local-first English immersion learning. The product direction is a personal immersion workspace built around real audio input, not a general course platform.

## Recent Work Completed

### Local Media Playback Reliability

- Fixed local audio/video playback in Tauri WebView.
- Local filesystem paths are no longer assigned directly to `<audio>` / `<video>`.
- Added `src/utils/mediaAsset.ts` to:
  - request backend authorization for a selected media file;
  - convert the local path with `convertFileSrc`;
  - fall back gracefully in browser preview.
- Added Tauri command `allow_media_file`.
- Enabled Tauri `assetProtocol` with an empty static scope and runtime file-level authorization.
- Enabled Cargo feature `protocol-asset`.
- Applied the same local media conversion to historical recording playback.

### User-Visible Error Feedback

- Added toast feedback to common user workflows:
  - player file open;
  - podcast feed load;
  - podcast audio download;
  - recording save/play/delete;
  - writing file read/save/delete;
  - diary read/save/delete;
  - opening data, cache, diary, writing, and recording folders;
  - dictation file pick, save, and delete.
- Reduced reliance on `console.error` as the only failure surface.

### Data Ownership Cleanup

- Removed `dictation` and `podcastFeeds` from `AppData`.
- Removed `vocabulary`, `recordingHistory`, and `writingFiles` from `AppData`.
- `podcastFeeds` is now owned by `podcastStore`.
- `dictation` history is now owned by `dictationStore`.
- `vocabulary` is now owned by `vocabularyStore`.
- `recordingHistory` is now owned by `recordingStore`.
- Free-writing file metadata and diary history are now owned by `writingStore`.
- `data.ts` no longer loads or saves `dictation.json` and `podcast_feeds.json` through the centralized `saveAllData` path.
- `DictationScene` reads `history` and `loaded` directly from `useDictationStore`.
- Dictation history loading is sorted newest first.
- Dictation delete now rolls back in-memory state if persistence fails.
- `WritingScene`, `DiaryView`, and `HubScene` no longer import `@tauri-apps/plugin-fs`.
- `checkin` has moved out of `AppData` into `checkinStore`.
- `VocabularyScene` can jump from a word card timestamp back to `PlayerScene` and restore the media position.

### Storage Hardening

- Added `src/utils/jsonStorage.ts` as the shared JSON persistence helper.
- Centralized JSON array loading and writing for:
  - `vocabulary.json`;
  - `checkin.json`;
  - `recordings.json`;
  - `dictation.json`;
  - `podcast_feeds.json`.
- JSON writes now create a same-path `.bak` backup before overwrite.
- Corrupted JSON files are moved to timestamped `.corrupt-*.bak` files and replaced with defaults.
- JSON arrays with invalid records are backed up, cleaned, and written back.
- App startup now surfaces recovery notices with warning toasts for centralized AppData files.

## Important Implementation Notes

- Existing unrelated working tree changes were preserved and not reverted.
- `src-tauri/Cargo.lock` now includes `http-range` because enabling Tauri `protocol-asset` pulls it in.
- `saveAllData` currently owns only:
  - nothing persistent, because `checkin` has moved to `checkinStore` and the player state remains in-memory only;
  - not `vocabulary`, because `vocabularyStore` owns it;
  - not `recordingHistory`, because `recordingStore` owns it;
  - not `writingFiles` content or diary files, because `writingStore` owns them;
  - not `dictation` or `podcastFeeds`, because stores own those.
- `dictationStore` and `podcastStore` now use the shared JSON storage helper while keeping domain ownership local to each store.
- `recordingHistory` has moved out of `AppData` into `recordingStore`.
- `recordingStore` owns `recordings.json`, uses `jsonStorage.ts`, sorts newest first, rolls back metadata changes if persistence fails, and scans `.webm` files as a fallback when metadata is empty.
- `writingFiles` has moved out of `AppData` into `writingStore`.
- `writingStore` owns the free-writing file list by scanning `writing/*.txt`, updating in-memory metadata after file saves/deletes, and handling free-writing create/read/save/delete.
- `writingStore` also owns diary history, diary read/save/delete, and the diary count used by the hub.
- `src/utils/writingFiles.ts` contains pure helpers for writing paths, sanitized names, and diary date parsing.
- `jsonStorage` now has a pure `jsonStorageCore.ts` parser so recovery decisions can be tested without loading Tauri filesystem APIs.
- Added `npm test` with lightweight TypeScript/Node tests for JSON storage parse, validation behavior, check-in calculations, subtitle parsing, sanitize rules, and writing/diary filename helpers.
- Added Rust-side RSS parsing tests.

### Backup and Restore

- Added `src/utils/backupCore.ts` for backup manifest and payload validation.
- Added `src/utils/backup.ts` for exporting and importing a single-file local backup.
- Backups now include:
  - app JSON files;
  - writing `.txt` files;
  - diary `.txt` files;
  - recording metadata;
  - optional `.webm` recordings.
- Import creates a pre-import backup in the app data directory before applying the restored payload.
- Added a backup section to the hub screen.
- `safeParseJSON` still exists in `validators.ts`, but the main JSON persistence paths now use `jsonStorage.ts`.

## Verification Run

These checks passed after the changes:

```bash
npm test
npm run build
cargo check
```

Current test count: 94 passing tests across 7 files.
