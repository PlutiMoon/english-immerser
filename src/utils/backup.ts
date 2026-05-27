import {
  exists,
  readDir,
  readFile,
  readTextFile,
  remove,
  writeFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { dataFiles, dataPaths, ensureDataDirs } from "./dataPath";
import {
  backupFilename,
  createBackupManifest,
  parseBackupPayload,
  preImportBackupFilename,
  type BackupFileEntry,
  type BackupPayload,
} from "./backupCore";

const APP_VERSION = "0.4.0";

interface CreateBackupOptions {
  includeRecordingFiles?: boolean;
}

export interface CreatedBackup {
  filename: string;
  content: string;
  payload: BackupPayload;
}

export interface ImportBackupResult {
  preImportBackupPath: string;
  importedFiles: number;
}

export async function createBackup(options: CreateBackupOptions = {}): Promise<CreatedBackup> {
  await ensureDataDirs();
  const files = [
    ...await collectJsonFiles(options.includeRecordingFiles === true),
    ...await collectTextFiles("writing", await dataPaths.writing()),
    ...await collectTextFiles("diary", await dataPaths.diary()),
    ...options.includeRecordingFiles
      ? await collectRecordingFiles(await dataPaths.recordings())
      : [],
  ];
  const payload: BackupPayload = {
    manifest: createBackupManifest(files, APP_VERSION),
    files,
  };

  return {
    filename: backupFilename(payload.manifest.exportedAt),
    content: JSON.stringify(payload, null, 2),
    payload,
  };
}

export async function importBackup(raw: string): Promise<ImportBackupResult> {
  const payload = parseBackupPayload(raw);
  await ensureDataDirs();

  const current = await createBackup({ includeRecordingFiles: true });
  const preImportBackupPath = `${await dataPaths.root()}/${preImportBackupFilename()}`;
  await writeTextFile(preImportBackupPath, current.content);

  try {
    await applyBackupPayload(payload);
  } catch (err) {
    await applyBackupPayload(current.payload);
    throw err;
  }

  return {
    preImportBackupPath,
    importedFiles: payload.files.length,
  };
}

async function collectJsonFiles(includeRecordingFiles: boolean): Promise<BackupFileEntry[]> {
  const paths = [
    { relativePath: "vocabulary.json", path: await dataFiles.vocabulary() },
    { relativePath: "checkin.json", path: await dataFiles.checkin() },
    { relativePath: "dictation.json", path: await dataFiles.dictation() },
    { relativePath: "podcast_feeds.json", path: await dataFiles.podcastFeeds() },
  ];
  if (includeRecordingFiles) {
    paths.push({ relativePath: "recordings.json", path: await dataFiles.recordingHistory() });
  }

  return Promise.all(
    paths.map(async ({ relativePath, path }) => ({
      path: relativePath,
      kind: "json" as const,
      encoding: "utf-8" as const,
      content: await readTextOrDefault(path, "[]"),
    })),
  );
}

async function collectTextFiles(kind: "writing" | "diary", dir: string): Promise<BackupFileEntry[]> {
  const entries = await readDirSafe(dir);
  const files = entries.filter((entry) => entry.name?.endsWith(".txt"));
  return Promise.all(
    files.map(async (entry) => ({
      path: `${kind}/${entry.name}`,
      kind,
      encoding: "utf-8" as const,
      content: await readTextOrDefault(`${dir}/${entry.name}`, ""),
    })),
  );
}

async function collectRecordingFiles(dir: string): Promise<BackupFileEntry[]> {
  const entries = await readDirSafe(dir);
  const files = entries.filter((entry) => entry.name?.endsWith(".webm"));
  return Promise.all(
    files.map(async (entry) => ({
      path: `recordings/${entry.name}`,
      kind: "recording" as const,
      encoding: "base64" as const,
      content: bytesToBase64(await readFile(`${dir}/${entry.name}`)),
    })),
  );
}

async function applyBackupPayload(payload: BackupPayload): Promise<void> {
  await clearManagedTextDir(await dataPaths.writing(), ".txt");
  await clearManagedTextDir(await dataPaths.diary(), ".txt");

  if (payload.files.some((file) => file.kind === "recording" || file.path === "recordings.json")) {
    await clearManagedTextDir(await dataPaths.recordings(), ".webm");
  }

  for (const file of payload.files) {
    await writeBackupFile(file);
  }
}

async function writeBackupFile(file: BackupFileEntry): Promise<void> {
  const absolutePath = await absolutePathForBackupEntry(file);
  if (file.encoding === "base64") {
    await writeFile(absolutePath, base64ToBytes(file.content));
  } else {
    await writeTextFile(absolutePath, file.content);
  }
}

async function absolutePathForBackupEntry(file: BackupFileEntry): Promise<string> {
  if (file.kind === "json") return `${await dataPaths.root()}/${file.path}`;
  return `${await dataPaths.root()}/${file.path}`;
}

async function clearManagedTextDir(dir: string, extension: string): Promise<void> {
  const entries = await readDirSafe(dir);
  await Promise.all(
    entries
      .filter((entry) => entry.name?.endsWith(extension))
      .map((entry) => remove(`${dir}/${entry.name}`).catch(() => undefined)),
  );
}

async function readTextOrDefault(path: string, defaultValue: string): Promise<string> {
  return await exists(path) ? readTextFile(path) : defaultValue;
}

async function readDirSafe(dir: string): Promise<{ name: string }[]> {
  try {
    return await readDir(dir);
  } catch {
    return [];
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
