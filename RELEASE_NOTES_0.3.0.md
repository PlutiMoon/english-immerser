# English Immerser 0.3.0

## Highlights

- Added a dedicated tools scene for backup, restore, and local folder shortcuts.
- Added single-file local backup export/import.
- Added a pre-import safety backup flow.
- Added backup round-trip tests.
- Added explicit backup schema compatibility checks.
- Moved player state into a dedicated store.
- Cleaned up JSON recovery handling and shared toast formatting.

## Backup details

- Backup export includes:
  - `vocabulary.json`
  - `checkin.json`
  - `dictation.json`
  - `podcast_feeds.json`
  - `writing/*.txt`
  - `diary/*.txt`
  - optional `recordings.json`
  - optional `recordings/*.webm`
- Import writes a `pre-import-backup-*.json` file before applying changes.
- Backup schema version is `1`.

## Compatibility

- Backups with newer schema versions are rejected with an upgrade hint.
- Backups with older schema versions are rejected with a compatibility hint.
- The app stores all user data locally in the system Documents folder.
