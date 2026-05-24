import { describe, expect, it } from "vitest";
import {
  BACKUP_APP_NAME,
  BACKUP_SCHEMA_VERSION,
  backupFilename,
  createBackupManifest,
  isAllowedBackupPath,
  parseBackupPayload,
  preImportBackupFilename,
} from "../src/utils/backupCore";

describe("backupCore path guards", () => {
  it("accepts only known safe backup paths", () => {
    expect(isAllowedBackupPath("vocabulary.json", "json")).toBe(true);
    expect(isAllowedBackupPath("writing/draft.txt", "writing")).toBe(true);
    expect(isAllowedBackupPath("diary/2026-05-24.txt", "diary")).toBe(true);
    expect(isAllowedBackupPath("recordings/clip.webm", "recording")).toBe(true);
  });

  it("rejects traversal and shape mismatches", () => {
    expect(isAllowedBackupPath("../vocabulary.json", "json")).toBe(false);
    expect(isAllowedBackupPath("writing/nested/draft.txt", "writing")).toBe(false);
    expect(isAllowedBackupPath("diary/today.txt", "diary")).toBe(false);
    expect(isAllowedBackupPath("recordings/clip.txt", "recording")).toBe(false);
  });
});

describe("backupCore naming", () => {
  it("builds stable backup filenames", () => {
    expect(backupFilename("2026-05-24T08:30:00.000Z")).toBe(
      "english-immerser-backup-2026-05-24T08-30-00-000Z.json",
    );
    expect(preImportBackupFilename("2026-05-24T08:30:00.000Z")).toBe(
      "pre-import-backup-2026-05-24T08-30-00-000Z.json",
    );
  });
});

describe("backupCore payload parsing", () => {
  it("parses a valid payload", () => {
    const raw = JSON.stringify({
      manifest: {
        app: BACKUP_APP_NAME,
        schemaVersion: BACKUP_SCHEMA_VERSION,
        appVersion: "0.2.0",
        exportedAt: "2026-05-24T08:30:00.000Z",
        includes: { jsonFiles: 1, writingFiles: 0, diaryFiles: 0, recordingFiles: 0 },
      },
      files: [
        { path: "checkin.json", kind: "json", encoding: "utf-8", content: "[]" },
      ],
    });

    const payload = parseBackupPayload(raw);
    expect(payload.files).toHaveLength(1);
    expect(payload.manifest.app).toBe(BACKUP_APP_NAME);
  });

  it("rejects malformed payloads", () => {
    expect(() => parseBackupPayload("{}")).toThrow();
    expect(() => parseBackupPayload("{not-json")).toThrow();
  });
});

describe("backupCore manifest", () => {
  it("counts included file kinds", () => {
    const manifest = createBackupManifest(
      [
        { path: "checkin.json", kind: "json", encoding: "utf-8", content: "[]" },
        { path: "writing/a.txt", kind: "writing", encoding: "utf-8", content: "hello" },
        { path: "diary/2026-05-24.txt", kind: "diary", encoding: "utf-8", content: "one" },
        { path: "recordings/a.webm", kind: "recording", encoding: "base64", content: "Zg==" },
      ],
      "0.2.0",
      "2026-05-24T08:30:00.000Z",
    );

    expect(manifest.includes).toEqual({
      jsonFiles: 1,
      writingFiles: 1,
      diaryFiles: 1,
      recordingFiles: 1,
    });
  });
});
