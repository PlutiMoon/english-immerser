export const BACKUP_SCHEMA_VERSION = 1;
export const BACKUP_APP_NAME = "English Immerser";

export type BackupFileKind = "json" | "writing" | "diary" | "recording";
export type BackupEncoding = "utf-8" | "base64";

export interface BackupFileEntry {
  path: string;
  kind: BackupFileKind;
  encoding: BackupEncoding;
  content: string;
}

export interface BackupManifest {
  app: typeof BACKUP_APP_NAME;
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  appVersion: string;
  exportedAt: string;
  includes: {
    jsonFiles: number;
    writingFiles: number;
    diaryFiles: number;
    recordingFiles: number;
  };
}

export interface BackupPayload {
  manifest: BackupManifest;
  files: BackupFileEntry[];
}

const JSON_FILES = new Set([
  "vocabulary.json",
  "checkin.json",
  "dictation.json",
  "podcast_feeds.json",
  "recordings.json",
]);

export function createBackupManifest(
  files: BackupFileEntry[],
  appVersion: string,
  exportedAt = new Date().toISOString(),
): BackupManifest {
  return {
    app: BACKUP_APP_NAME,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion,
    exportedAt,
    includes: {
      jsonFiles: files.filter((file) => file.kind === "json").length,
      writingFiles: files.filter((file) => file.kind === "writing").length,
      diaryFiles: files.filter((file) => file.kind === "diary").length,
      recordingFiles: files.filter((file) => file.kind === "recording").length,
    },
  };
}

export function parseBackupPayload(raw: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("备份文件不是有效的 JSON");
  }

  if (!isBackupPayload(parsed)) {
    throw new Error("备份文件格式不正确");
  }

  return parsed;
}

export function isBackupPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as BackupPayload;
  if (!isBackupManifest(payload.manifest)) return false;
  if (!Array.isArray(payload.files)) return false;
  return payload.files.every(isBackupFileEntry);
}

export function isBackupFileEntry(value: unknown): value is BackupFileEntry {
  if (!value || typeof value !== "object") return false;
  const file = value as BackupFileEntry;
  return (
    typeof file.path === "string" &&
    isAllowedBackupPath(file.path, file.kind) &&
    isBackupKind(file.kind) &&
    isBackupEncoding(file.encoding) &&
    encodingMatchesKind(file.kind, file.encoding) &&
    typeof file.content === "string"
  );
}

export function isAllowedBackupPath(path: string, kind: BackupFileKind): boolean {
  if (!path || path.includes("\\") || path.startsWith("/") || path.includes("..")) {
    return false;
  }

  if (kind === "json") return JSON_FILES.has(path);
  if (kind === "writing") return /^writing\/[^/]+\.txt$/.test(path);
  if (kind === "diary") return /^diary\/\d{4}-\d{2}-\d{2}\.txt$/.test(path);
  if (kind === "recording") return /^recordings\/[^/]+\.webm$/.test(path);
  return false;
}

export function backupFilename(exportedAt = new Date().toISOString()): string {
  return `english-immerser-backup-${timestampForFilename(exportedAt)}.json`;
}

export function preImportBackupFilename(exportedAt = new Date().toISOString()): string {
  return `pre-import-backup-${timestampForFilename(exportedAt)}.json`;
}

function isBackupManifest(value: unknown): value is BackupManifest {
  if (!value || typeof value !== "object") return false;
  const manifest = value as BackupManifest;
  return (
    manifest.app === BACKUP_APP_NAME &&
    manifest.schemaVersion === BACKUP_SCHEMA_VERSION &&
    typeof manifest.appVersion === "string" &&
    typeof manifest.exportedAt === "string" &&
    !!manifest.includes &&
    typeof manifest.includes.jsonFiles === "number" &&
    typeof manifest.includes.writingFiles === "number" &&
    typeof manifest.includes.diaryFiles === "number" &&
    typeof manifest.includes.recordingFiles === "number"
  );
}

function isBackupKind(kind: unknown): kind is BackupFileKind {
  return kind === "json" || kind === "writing" || kind === "diary" || kind === "recording";
}

function isBackupEncoding(encoding: unknown): encoding is BackupEncoding {
  return encoding === "utf-8" || encoding === "base64";
}

function encodingMatchesKind(kind: BackupFileKind, encoding: BackupEncoding): boolean {
  return kind === "recording" ? encoding === "base64" : encoding === "utf-8";
}

function timestampForFilename(value: string): string {
  return value.replace(/[:.]/g, "-");
}
