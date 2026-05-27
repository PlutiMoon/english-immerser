import { beforeEach, describe, expect, it, vi } from "vitest";
import { BACKUP_APP_NAME, BACKUP_SCHEMA_VERSION, parseBackupPayload } from "../src/utils/backupCore";

const mockFs = vi.hoisted(() => {
  const textFiles = new Map<string, string>();
  const binaryFiles = new Map<string, Uint8Array>();

  const normalize = (path: string) => path.replace(/\\/g, "/").replace(/\/$/, "");
  const parentDir = (path: string) => normalize(path).split("/").slice(0, -1).join("/");

  return {
    textFiles,
    binaryFiles,
    reset() {
      textFiles.clear();
      binaryFiles.clear();
    },
    setText(path: string, content: string) {
      textFiles.set(normalize(path), content);
      binaryFiles.delete(normalize(path));
    },
    setBinary(path: string, content: Uint8Array) {
      binaryFiles.set(normalize(path), new Uint8Array(content));
      textFiles.delete(normalize(path));
    },
    exists(path: string) {
      const key = normalize(path);
      return textFiles.has(key) || binaryFiles.has(key);
    },
    async readDir(dir: string) {
      const key = normalize(dir);
      const names = new Set<string>();
      for (const path of [...textFiles.keys(), ...binaryFiles.keys()]) {
        if (parentDir(path) === key) {
          names.add(path.split("/").pop() ?? "");
        }
      }
      return [...names].map((name) => ({ name }));
    },
    async readTextFile(path: string) {
      const key = normalize(path);
      if (!textFiles.has(key)) throw new Error(`Missing text file: ${key}`);
      return textFiles.get(key) ?? "";
    },
    async readFile(path: string) {
      const key = normalize(path);
      if (!binaryFiles.has(key)) throw new Error(`Missing binary file: ${key}`);
      return new Uint8Array(binaryFiles.get(key) ?? new Uint8Array());
    },
    async writeTextFile(path: string, content: string) {
      const key = normalize(path);
      textFiles.set(key, content);
      binaryFiles.delete(key);
    },
    async writeFile(path: string, content: Uint8Array) {
      const key = normalize(path);
      binaryFiles.set(key, new Uint8Array(content));
      textFiles.delete(key);
    },
    async remove(path: string) {
      const key = normalize(path);
      textFiles.delete(key);
      binaryFiles.delete(key);
    },
    snapshot(path: string) {
      const key = normalize(path);
      if (textFiles.has(key)) return textFiles.get(key) ?? null;
      if (binaryFiles.has(key)) return new Uint8Array(binaryFiles.get(key) ?? new Uint8Array());
      return null;
    },
  };
});

vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: vi.fn((path: string) => Promise.resolve(mockFs.exists(path))),
  readDir: vi.fn((dir: string) => mockFs.readDir(dir)),
  readFile: vi.fn((path: string) => mockFs.readFile(path)),
  readTextFile: vi.fn((path: string) => mockFs.readTextFile(path)),
  remove: vi.fn((path: string) => mockFs.remove(path)),
  writeFile: vi.fn((path: string, content: Uint8Array) => mockFs.writeFile(path, content)),
  writeTextFile: vi.fn((path: string, content: string) => mockFs.writeTextFile(path, content)),
}));

vi.mock("../src/utils/dataPath", () => ({
  ensureDataDirs: vi.fn(async () => {}),
  dataPaths: {
    root: async () => "/mock/English Immerser",
    diary: async () => "/mock/English Immerser/diary",
    writing: async () => "/mock/English Immerser/writing",
    recordings: async () => "/mock/English Immerser/recordings",
  },
  dataFiles: {
    vocabulary: async () => "/mock/English Immerser/vocabulary.json",
    checkin: async () => "/mock/English Immerser/checkin.json",
    dictation: async () => "/mock/English Immerser/dictation.json",
    podcastFeeds: async () => "/mock/English Immerser/podcast_feeds.json",
    recordingHistory: async () => "/mock/English Immerser/recordings.json",
  },
}));

const backupModule = await import("../src/utils/backup");

const { createBackup, importBackup } = backupModule;

beforeEach(() => {
  mockFs.reset();
});

describe("backup round-trip", () => {
  it("exports and re-imports all owned data", async () => {
    seedOriginalState();

    const backup = await createBackup({ includeRecordingFiles: true });
    const payload = parseBackupPayload(backup.content);

    expect(payload.manifest).toMatchObject({
      app: BACKUP_APP_NAME,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      includes: {
        jsonFiles: 5,
        writingFiles: 1,
        diaryFiles: 1,
        recordingFiles: 1,
      },
    });
    expect(payload.files).toHaveLength(8);

    seedMutatedState();

    const result = await importBackup(backup.content);
    expect(result.importedFiles).toBe(8);

    expect(mockFs.snapshot("/mock/English Immerser/vocabulary.json")).toBe('[{"id":"v1"}]');
    expect(mockFs.snapshot("/mock/English Immerser/checkin.json")).toBe(
      '[{"date":"2026-05-24","durationMinutes":30,"modules":["player"]}]',
    );
    expect(mockFs.snapshot("/mock/English Immerser/dictation.json")).toBe('[{"id":"d1"}]');
    expect(mockFs.snapshot("/mock/English Immerser/podcast_feeds.json")).toBe(
      '[{"name":"BBC","url":"https://example.com/rss"}]',
    );
    expect(mockFs.snapshot("/mock/English Immerser/recordings.json")).toBe(
      '[{"name":"rec.webm","path":"/mock/English Immerser/recordings/rec.webm","duration":12,"createdAt":"2026-05-24T08:30:00.000Z"}]',
    );
    expect(mockFs.snapshot("/mock/English Immerser/writing/essay.txt")).toBe("hello draft");
    expect(mockFs.snapshot("/mock/English Immerser/diary/2026-05-24.txt")).toBe("first line");
    expect(mockFs.snapshot("/mock/English Immerser/writing/stale.txt")).toBeNull();
    expect(mockFs.snapshot("/mock/English Immerser/diary/2026-05-23.txt")).toBeNull();
    expect(mockFs.snapshot("/mock/English Immerser/recordings/stale.webm")).toBeNull();

    const preImportBackup = mockFs.snapshot(result.preImportBackupPath);
    expect(typeof preImportBackup).toBe("string");
    const preImportPayload = parseBackupPayload(preImportBackup as string);
    expect(preImportPayload.files.some((file) => file.path === "writing/essay.txt" && file.content === "stale draft")).toBe(true);
    expect(preImportPayload.files.some((file) => file.path === "recordings/stale.webm")).toBe(true);
  });
});

function seedOriginalState(): void {
  mockFs.setText("/mock/English Immerser/vocabulary.json", '[{"id":"v1"}]');
  mockFs.setText(
    "/mock/English Immerser/checkin.json",
    '[{"date":"2026-05-24","durationMinutes":30,"modules":["player"]}]',
  );
  mockFs.setText("/mock/English Immerser/dictation.json", '[{"id":"d1"}]');
  mockFs.setText(
    "/mock/English Immerser/podcast_feeds.json",
    '[{"name":"BBC","url":"https://example.com/rss"}]',
  );
  mockFs.setText(
    "/mock/English Immerser/recordings.json",
    '[{"name":"rec.webm","path":"/mock/English Immerser/recordings/rec.webm","duration":12,"createdAt":"2026-05-24T08:30:00.000Z"}]',
  );
  mockFs.setText("/mock/English Immerser/writing/essay.txt", "hello draft");
  mockFs.setText("/mock/English Immerser/diary/2026-05-24.txt", "first line");
  mockFs.setBinary("/mock/English Immerser/recordings/rec.webm", new Uint8Array([1, 2, 3]));
}

function seedMutatedState(): void {
  mockFs.setText("/mock/English Immerser/vocabulary.json", '[{"id":"v2"}]');
  mockFs.setText("/mock/English Immerser/checkin.json", "[]");
  mockFs.setText("/mock/English Immerser/dictation.json", "[]");
  mockFs.setText("/mock/English Immerser/podcast_feeds.json", "[]");
  mockFs.setText("/mock/English Immerser/recordings.json", "[]");
  mockFs.setText("/mock/English Immerser/writing/essay.txt", "stale draft");
  mockFs.setText("/mock/English Immerser/diary/2026-05-24.txt", "old diary");
  mockFs.setText("/mock/English Immerser/writing/stale.txt", "stale file");
  mockFs.setText("/mock/English Immerser/diary/2026-05-23.txt", "stale diary");
  mockFs.setBinary("/mock/English Immerser/recordings/stale.webm", new Uint8Array([9]));
}
